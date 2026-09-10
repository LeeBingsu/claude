package com.mdcraft.editor

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.mdcraft.editor.model.Screen
import com.mdcraft.editor.model.UiEvent
import com.mdcraft.editor.ui.EditorScreen
import com.mdcraft.editor.ui.HomeScreen
import com.mdcraft.editor.ui.theme.MdFileEditorTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIncomingIntent(intent)

        setContent {
            MdFileEditorTheme {
                Surface {
                    AppRoot(viewModel)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return
        if (intent.action == Intent.ACTION_VIEW || intent.action == Intent.ACTION_EDIT) {
            intent.data?.let { uri -> viewModel.openDocument(uri, intent.flags) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppRoot(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var showUnsavedDialog by remember { mutableStateOf(false) }

    val createDocumentLauncher = rememberLauncherForCreateDocument { uri ->
        uri?.let { viewModel.onCreateDocumentResult(it) }
    }
    val openDocumentLauncher = rememberLauncherForOpenDocument { uri ->
        uri?.let { viewModel.onOpenDocumentResult(it) }
    }

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is UiEvent.Message -> scope.launch { snackbarHostState.showSnackbar(event.text) }
                is UiEvent.RequestCreateDocument -> createDocumentLauncher.launch(event.suggestedName)
            }
        }
    }

    if (uiState.screen == Screen.EDITOR) {
        BackHandler {
            if (uiState.document.isDirty) showUnsavedDialog = true else viewModel.goHome()
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        when (uiState.screen) {
            Screen.HOME -> HomeScreen(
                modifier = Modifier.padding(padding),
                recentFiles = uiState.recentFiles,
                onOpenFile = { openDocumentLauncher.launch(arrayOf("*/*")) },
                onCreateNew = { type, name -> viewModel.createNewDraft(type, name) },
                onOpenRecent = { file -> viewModel.openDocument(android.net.Uri.parse(file.uri)) },
                onRemoveRecent = { file -> viewModel.removeRecent(file.uri) }
            )
            Screen.EDITOR -> EditorScreen(
                modifier = Modifier.padding(padding),
                document = uiState.document,
                onBack = { if (uiState.document.isDirty) showUnsavedDialog = true else viewModel.goHome() },
                onContentChange = viewModel::updateContent,
                onTogglePreview = viewModel::togglePreview,
                onSave = viewModel::requestSave,
                onSaveAs = {
                    createDocumentLauncher.launch(uiState.document.fileName)
                }
            )
        }
    }

    if (showUnsavedDialog) {
        AlertDialog(
            onDismissRequest = { showUnsavedDialog = false },
            title = { Text(stringResource(R.string.editor_unsaved_dialog_title)) },
            text = { Text(stringResource(R.string.editor_unsaved_dialog_message)) },
            confirmButton = {
                TextButton(onClick = {
                    // Saving a brand-new draft needs the create-document picker to
                    // return first, so only leave immediately when the document
                    // already has a backing Uri; otherwise the user presses back
                    // again once the save finishes (the dialog won't reappear
                    // since the document is no longer dirty).
                    val alreadyHasUri = uiState.document.uri != null
                    showUnsavedDialog = false
                    viewModel.requestSave()
                    if (alreadyHasUri) viewModel.goHome()
                }) { Text(stringResource(R.string.editor_unsaved_dialog_save)) }
            },
            dismissButton = {
                TextButton(onClick = {
                    showUnsavedDialog = false
                    viewModel.goHome()
                }) { Text(stringResource(R.string.editor_unsaved_dialog_discard)) }
            }
        )
    }
}

@Composable
private fun rememberLauncherForCreateDocument(onResult: (android.net.Uri?) -> Unit) =
    androidx.activity.compose.rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("*/*"),
        onResult = onResult
    )

@Composable
private fun rememberLauncherForOpenDocument(onResult: (android.net.Uri?) -> Unit) =
    androidx.activity.compose.rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
        onResult = onResult
    )
