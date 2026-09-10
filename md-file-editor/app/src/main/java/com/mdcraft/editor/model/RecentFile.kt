package com.mdcraft.editor.model

/** A previously opened or created document, remembered on the home screen. */
data class RecentFile(
    val uri: String,
    val displayName: String,
    val type: DocumentType,
    val lastOpenedAt: Long
)
