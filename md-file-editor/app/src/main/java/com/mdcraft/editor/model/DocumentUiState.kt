package com.mdcraft.editor.model

/**
 * The document currently open in the editor. [uri] is null until it has been
 * saved once. [extension] is the literal extension for this file (it can be
 * a user-defined one, so it is not always [type]'s default extension).
 */
data class DocumentUiState(
    val uri: String? = null,
    val name: String = "",
    val type: DocumentType = DocumentType.MARKDOWN,
    val extension: String = DocumentType.MARKDOWN.extension,
    val content: String = "",
    val isDirty: Boolean = false,
    val isPreview: Boolean = false,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false
) {
    val fileName: String
        get() = when {
            extension.isBlank() -> name
            name.substringAfterLast('.', "").equals(extension, ignoreCase = true) -> name
            else -> "$name.$extension"
        }
}

enum class Screen { HOME, EDITOR }

data class AppUiState(
    val screen: Screen = Screen.HOME,
    val recentFiles: List<RecentFile> = emptyList(),
    val customTypes: List<String> = emptyList(),
    val document: DocumentUiState = DocumentUiState()
)

sealed interface UiEvent {
    data class RequestCreateDocument(val suggestedName: String) : UiEvent
    data class Message(val text: String) : UiEvent
}
