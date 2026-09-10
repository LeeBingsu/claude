package com.mdcraft.editor

import android.app.Application
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mdcraft.editor.data.DocumentRepository
import com.mdcraft.editor.data.RecentFilesStore
import com.mdcraft.editor.model.AppUiState
import com.mdcraft.editor.model.DocumentType
import com.mdcraft.editor.model.DocumentUiState
import com.mdcraft.editor.model.RecentFile
import com.mdcraft.editor.model.Screen
import com.mdcraft.editor.model.UiEvent
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val recentFilesStore = RecentFilesStore(application)

    private val _uiState = MutableStateFlow(AppUiState())
    val uiState: StateFlow<AppUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<UiEvent>(extraBufferCapacity = 4)
    val events = _events.asSharedFlow()

    init {
        viewModelScope.launch {
            recentFilesStore.recentFiles.collect { files ->
                _uiState.update { it.copy(recentFiles = files) }
            }
        }
    }

    fun goHome() {
        _uiState.update { it.copy(screen = Screen.HOME, document = DocumentUiState()) }
    }

    fun createNewDraft(type: DocumentType, requestedName: String) {
        val safeName = requestedName.ifBlank { getApplication<Application>().getString(R.string.editor_untitled) }
        _uiState.update {
            it.copy(
                screen = Screen.EDITOR,
                document = DocumentUiState(
                    uri = null,
                    name = safeName,
                    type = type,
                    content = type.template,
                    isDirty = true
                )
            )
        }
    }

    fun openDocument(uri: Uri, sourceFlags: Int = 0) {
        val context = getApplication<Application>()
        _uiState.update { it.copy(screen = Screen.EDITOR, document = DocumentUiState(isLoading = true)) }
        viewModelScope.launch {
            try {
                DocumentRepository.tryTakePersistablePermission(context, uri, sourceFlags)
                val name = DocumentRepository.displayName(context, uri)
                val mimeType = DocumentRepository.mimeType(context, uri)
                val type = DocumentType.fromMimeType(mimeType, name)
                val text = DocumentRepository.readText(context, uri)
                _uiState.update {
                    it.copy(
                        document = DocumentUiState(
                            uri = uri.toString(),
                            name = name,
                            type = type,
                            content = text,
                            isDirty = false
                        )
                    )
                }
                recentFilesStore.upsert(
                    RecentFile(
                        uri = uri.toString(),
                        displayName = name,
                        type = type,
                        lastOpenedAt = System.currentTimeMillis()
                    )
                )
            } catch (e: Exception) {
                _uiState.update { it.copy(screen = Screen.HOME) }
                _events.tryEmit(
                    UiEvent.Message(
                        context.getString(R.string.editor_open_failed, e.message ?: e.toString())
                    )
                )
            }
        }
    }

    fun updateContent(text: String) {
        _uiState.update { it.copy(document = it.document.copy(content = text, isDirty = true)) }
    }

    fun togglePreview() {
        _uiState.update { it.copy(document = it.document.copy(isPreview = !it.document.isPreview)) }
    }

    /** Save button: create-on-first-save if the draft has no backing Uri yet. */
    fun requestSave() {
        val document = _uiState.value.document
        if (document.uri == null) {
            _events.tryEmit(UiEvent.RequestCreateDocument(document.fileName))
        } else {
            performSave(Uri.parse(document.uri))
        }
    }

    /** Called once the "다른 이름으로 저장" create-document picker returns a destination. */
    fun onCreateDocumentResult(uri: Uri) {
        val context = getApplication<Application>()
        DocumentRepository.tryTakePersistablePermission(
            context,
            uri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        )
        val name = DocumentRepository.displayName(context, uri)
        _uiState.update { it.copy(document = it.document.copy(uri = uri.toString(), name = name)) }
        performSave(uri)
    }

    fun onOpenDocumentResult(uri: Uri) {
        openDocument(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
    }

    fun removeRecent(uri: String) {
        viewModelScope.launch { recentFilesStore.remove(uri) }
    }

    private fun performSave(uri: Uri) {
        val context = getApplication<Application>()
        val content = _uiState.value.document.content
        val type = _uiState.value.document.type
        _uiState.update { it.copy(document = it.document.copy(isSaving = true)) }
        viewModelScope.launch {
            try {
                DocumentRepository.writeText(context, uri, content)
                _uiState.update {
                    it.copy(document = it.document.copy(isSaving = false, isDirty = false))
                }
                recentFilesStore.upsert(
                    RecentFile(
                        uri = uri.toString(),
                        displayName = _uiState.value.document.name,
                        type = type,
                        lastOpenedAt = System.currentTimeMillis()
                    )
                )
                _events.tryEmit(UiEvent.Message(context.getString(R.string.editor_saved)))
            } catch (e: Exception) {
                _uiState.update { it.copy(document = it.document.copy(isSaving = false)) }
                _events.tryEmit(
                    UiEvent.Message(context.getString(R.string.editor_save_failed, e.message ?: e.toString()))
                )
            }
        }
    }
}
