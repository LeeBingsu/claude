package com.mdcraft.editor.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.automirrored.filled.Article
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.mdcraft.editor.R
import com.mdcraft.editor.model.DocumentType
import com.mdcraft.editor.model.RecentFile
import java.text.DateFormat
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    recentFiles: List<RecentFile>,
    customTypes: List<String>,
    onOpenFile: () -> Unit,
    onCreateNew: (type: DocumentType, extension: String, name: String) -> Unit,
    onAddCustomType: (String) -> Unit,
    onRemoveCustomType: (String) -> Unit,
    onOpenRecent: (RecentFile) -> Unit,
    onRemoveRecent: (RecentFile) -> Unit,
    modifier: Modifier = Modifier
) {
    var showNewFileDialog by remember { mutableStateOf(false) }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.home_title)) },
                actions = {
                    IconButton(onClick = onOpenFile) {
                        Icon(Icons.Filled.FolderOpen, contentDescription = stringResource(R.string.action_open_file))
                    }
                    IconButton(onClick = { showNewFileDialog = true }) {
                        Icon(Icons.Filled.Add, contentDescription = stringResource(R.string.action_new_file))
                    }
                }
            )
        }
    ) { padding ->
        if (recentFiles.isEmpty()) {
            EmptyHome(padding)
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = 8.dp, horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(recentFiles, key = { it.uri }) { file ->
                    RecentFileRow(
                        file = file,
                        onClick = { onOpenRecent(file) },
                        onRemove = { onRemoveRecent(file) }
                    )
                }
            }
        }
    }

    if (showNewFileDialog) {
        NewFileDialog(
            customTypes = customTypes,
            onAddCustomType = onAddCustomType,
            onRemoveCustomType = onRemoveCustomType,
            onDismiss = { showNewFileDialog = false },
            onConfirm = { type, extension, name ->
                showNewFileDialog = false
                onCreateNew(type, extension, name)
            }
        )
    }
}

@Composable
private fun EmptyHome(padding: PaddingValues) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = stringResource(R.string.home_empty),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun RecentFileRow(file: RecentFile, onClick: () -> Unit, onRemove: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(file.displayName) },
            supportingContent = {
                Text("${file.type.label} · ${formatTimestamp(file.lastOpenedAt)}")
            },
            leadingContent = { Icon(iconFor(file.type), contentDescription = null) },
            trailingContent = {
                IconButton(onClick = onRemove) {
                    Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.action_remove_recent))
                }
            }
        )
    }
}

private fun iconFor(type: DocumentType) = when (type) {
    DocumentType.MARKDOWN -> Icons.AutoMirrored.Filled.Article
    DocumentType.JSON -> Icons.Filled.DataObject
    DocumentType.HTML -> Icons.Filled.Code
    DocumentType.TEXT -> Icons.Filled.Description
}

private fun formatTimestamp(millis: Long): String =
    DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(millis))

/** Built-in types map to their fixed extension; any other extension edits as plain text. */
private fun typeForExtension(extension: String): DocumentType =
    DocumentType.entries.find { it.extension == extension } ?: DocumentType.TEXT

@Composable
private fun NewFileDialog(
    customTypes: List<String>,
    onAddCustomType: (String) -> Unit,
    onRemoveCustomType: (String) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: (type: DocumentType, extension: String, name: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var selectedExtension by remember { mutableStateOf(DocumentType.MARKDOWN.extension) }
    var showAddCustomTypeDialog by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.new_file_title)) },
        text = {
            Column {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text(stringResource(R.string.new_file_name_label)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = stringResource(R.string.new_file_type_label),
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = 16.dp, bottom = 8.dp)
                )
                // A plain Row clips extra chips off-screen with no way to reach
                // them; a scrollable row keeps every built-in and custom type
                // reachable no matter how many are registered.
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(DocumentType.entries, key = { it.extension }) { type ->
                        FilterChip(
                            selected = selectedExtension == type.extension,
                            onClick = { selectedExtension = type.extension },
                            label = { Text(type.label) }
                        )
                    }
                    items(customTypes, key = { it }) { extension ->
                        FilterChip(
                            selected = selectedExtension == extension,
                            onClick = { selectedExtension = extension },
                            label = { Text(".$extension") },
                            trailingIcon = {
                                IconButton(
                                    onClick = {
                                        onRemoveCustomType(extension)
                                        if (selectedExtension == extension) {
                                            selectedExtension = DocumentType.MARKDOWN.extension
                                        }
                                    },
                                    modifier = Modifier.size(FilterChipDefaults.IconSize)
                                ) {
                                    Icon(
                                        Icons.Filled.Close,
                                        contentDescription = stringResource(R.string.action_remove_recent),
                                        modifier = Modifier.size(FilterChipDefaults.IconSize)
                                    )
                                }
                            }
                        )
                    }
                    item {
                        AssistChip(
                            onClick = { showAddCustomTypeDialog = true },
                            label = { Text(stringResource(R.string.action_add)) },
                            leadingIcon = { Icon(Icons.Filled.Add, contentDescription = null) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(typeForExtension(selectedExtension), selectedExtension, name.trim()) }) {
                Text(stringResource(R.string.action_create))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) }
        }
    )

    if (showAddCustomTypeDialog) {
        val reserved = remember(customTypes) { DocumentType.entries.map { it.extension } + customTypes }
        AddCustomTypeDialog(
            reservedExtensions = reserved,
            onDismiss = { showAddCustomTypeDialog = false },
            onConfirm = { extension ->
                showAddCustomTypeDialog = false
                onAddCustomType(extension)
                selectedExtension = extension
            }
        )
    }
}

@Composable
private fun AddCustomTypeDialog(
    reservedExtensions: List<String>,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var text by remember { mutableStateOf("") }
    val cleaned = text.trim().removePrefix(".").lowercase().filter { it.isLetterOrDigit() }
    val isDuplicate = cleaned.isNotEmpty() && reservedExtensions.contains(cleaned)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.custom_type_title)) },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text(stringResource(R.string.custom_type_label)) },
                singleLine = true,
                isError = isDuplicate,
                supportingText = {
                    if (isDuplicate) Text(stringResource(R.string.custom_type_duplicate))
                },
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(cleaned) },
                enabled = cleaned.isNotEmpty() && !isDuplicate
            ) {
                Text(stringResource(R.string.action_add))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) }
        }
    )
}
