package com.mdcraft.editor.data

import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import java.io.File
import java.io.FileNotFoundException

/** Reads and writes document contents through [ContentResolver], independent of scheme. */
object DocumentRepository {

    fun displayName(context: Context, uri: Uri): String {
        if (uri.scheme == ContentResolver.SCHEME_CONTENT) {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index >= 0 && cursor.moveToFirst()) {
                    cursor.getString(index)?.let { return it }
                }
            }
        }
        return uri.lastPathSegment?.substringAfterLast('/') ?: "untitled"
    }

    fun mimeType(context: Context, uri: Uri): String? = context.contentResolver.getType(uri)

    fun readText(context: Context, uri: Uri): String {
        val stream = context.contentResolver.openInputStream(uri)
            ?: throw FileNotFoundException("openInputStream returned null for $uri")
        return stream.use { it.bufferedReader(Charsets.UTF_8).readText() }
    }

    fun writeText(context: Context, uri: Uri, text: String) {
        val stream = context.contentResolver.openOutputStream(uri, "wt")
            ?: throw FileNotFoundException("openOutputStream returned null for $uri")
        stream.use { it.bufferedWriter(Charsets.UTF_8).apply { write(text); flush() } }
    }

    /** Renames (and, for SAF documents, potentially re-URIs) a document. Null on failure. */
    fun renameDocument(context: Context, uri: Uri, newName: String): Uri? = try {
        when (uri.scheme) {
            ContentResolver.SCHEME_CONTENT ->
                DocumentsContract.renameDocument(context.contentResolver, uri, newName)
            ContentResolver.SCHEME_FILE -> {
                val oldFile = uri.path?.let(::File)
                val parent = oldFile?.parentFile
                if (parent != null) {
                    val newFile = File(parent, newName)
                    if (oldFile.renameTo(newFile)) Uri.fromFile(newFile) else null
                } else {
                    null
                }
            }
            else -> null
        }
    } catch (e: Exception) {
        null
    }

    /** Best-effort: keeps read/write access across app restarts when the system allows it. */
    fun tryTakePersistablePermission(context: Context, uri: Uri, sourceFlags: Int) {
        if (uri.scheme != ContentResolver.SCHEME_CONTENT) return
        val flags = sourceFlags and
            (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        if (flags == 0) return
        try {
            context.contentResolver.takePersistableUriPermission(uri, flags)
        } catch (_: SecurityException) {
            // Not all providers grant persistable permissions; the document
            // still works for this session even if it can't be persisted.
        }
    }
}
