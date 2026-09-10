package com.mdcraft.editor.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mdcraft.editor.R
import com.mdcraft.editor.model.DocumentType
import com.mdcraft.editor.model.DocumentUiState
import com.mdcraft.editor.ui.preview.HtmlPreview
import com.mdcraft.editor.ui.preview.JsonPreview
import com.mdcraft.editor.ui.preview.MarkdownPreview

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditorScreen(
    document: DocumentUiState,
    onBack: () -> Unit,
    onContentChange: (String) -> Unit,
    onTogglePreview: () -> Unit,
    onSave: () -> Unit,
    onSaveAs: () -> Unit,
    onRename: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showMenu by remember { mutableStateOf(false) }
    var showRenameDialog by remember { mutableStateOf(false) }
    val hasPreview = document.type != DocumentType.TEXT

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = document.fileName.ifBlank { stringResource(R.string.editor_untitled) },
                        maxLines = 1
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.content_description_back))
                    }
                },
                actions = {
                    if (document.isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.padding(end = 16.dp).size(20.dp),
                            strokeWidth = 2.dp
                        )
                    }
                    if (hasPreview) {
                        IconButton(onClick = onTogglePreview) {
                            Icon(
                                imageVector = if (document.isPreview) Icons.Filled.Edit else Icons.Filled.Visibility,
                                contentDescription = stringResource(
                                    if (document.isPreview) R.string.editor_action_preview_off
                                    else R.string.editor_action_preview_on
                                )
                            )
                        }
                    }
                    IconButton(onClick = onSave, enabled = document.isDirty && !document.isSaving) {
                        Icon(Icons.Filled.Save, contentDescription = stringResource(R.string.editor_action_save))
                    }
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Filled.MoreVert, contentDescription = stringResource(R.string.content_description_more))
                    }
                    DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                        DropdownMenuItem(
                            text = { Text(stringResource(R.string.editor_action_rename)) },
                            onClick = {
                                showMenu = false
                                showRenameDialog = true
                            }
                        )
                        DropdownMenuItem(
                            text = { Text(stringResource(R.string.editor_action_save_as)) },
                            onClick = {
                                showMenu = false
                                onSaveAs()
                            }
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when {
                document.isLoading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                document.isPreview && hasPreview -> {
                    when (document.type) {
                        DocumentType.MARKDOWN -> MarkdownPreview(document.content, Modifier.fillMaxSize())
                        DocumentType.HTML -> HtmlPreview(document.content, Modifier.fillMaxSize())
                        DocumentType.JSON -> JsonPreview(document.content, Modifier.fillMaxSize())
                        DocumentType.TEXT -> Unit
                    }
                }
                else -> {
                    EditorTextField(
                        value = document.content,
                        onValueChange = onContentChange,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }

    if (showRenameDialog) {
        RenameFileDialog(
            currentName = document.fileName,
            onDismiss = { showRenameDialog = false },
            onConfirm = { newName ->
                showRenameDialog = false
                onRename(newName)
            }
        )
    }
}

@Composable
private fun RenameFileDialog(
    currentName: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var text by remember { mutableStateOf(currentName) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.editor_rename_title)) },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text(stringResource(R.string.editor_rename_label)) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(onClick = { onConfirm(text) }, enabled = text.isNotBlank()) {
                Text(stringResource(R.string.action_confirm))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) }
        }
    )
}

@Composable
private fun EditorTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .verticalScroll(rememberScrollState())
            .padding(4.dp),
        placeholder = { Text(stringResource(R.string.editor_content_hint)) },
        textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 14.sp),
        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.None),
        colors = TextFieldDefaults.colors(
            focusedContainerColor = MaterialTheme.colorScheme.surface,
            unfocusedContainerColor = MaterialTheme.colorScheme.surface,
            focusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent,
            unfocusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent
        )
    )
}
