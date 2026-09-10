package com.mdcraft.editor.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mdcraft.editor.model.DocumentType
import com.mdcraft.editor.model.RecentFile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject

private val Context.recentFilesDataStore by preferencesDataStore(name = "recent_files")

/** Persists the home screen's list of recently opened/created documents. */
class RecentFilesStore(private val context: Context) {

    private val key = stringPreferencesKey("recent_files_json")

    val recentFiles: Flow<List<RecentFile>> = context.recentFilesDataStore.data.map { prefs ->
        parse(prefs[key].orEmpty())
    }

    suspend fun upsert(file: RecentFile) {
        context.recentFilesDataStore.edit { prefs ->
            val current = parse(prefs[key].orEmpty()).toMutableList()
            current.removeAll { it.uri == file.uri }
            current.add(0, file)
            val trimmed = current.sortedByDescending { it.lastOpenedAt }.take(MAX_ENTRIES)
            prefs[key] = serialize(trimmed)
        }
    }

    suspend fun remove(uri: String) {
        context.recentFilesDataStore.edit { prefs ->
            val current = parse(prefs[key].orEmpty()).filterNot { it.uri == uri }
            prefs[key] = serialize(current)
        }
    }

    private fun parse(json: String): List<RecentFile> {
        if (json.isBlank()) return emptyList()
        return try {
            val array = JSONArray(json)
            buildList {
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    add(
                        RecentFile(
                            uri = obj.getString("uri"),
                            displayName = obj.getString("name"),
                            type = DocumentType.valueOf(obj.getString("type")),
                            lastOpenedAt = obj.getLong("lastOpenedAt")
                        )
                    )
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun serialize(files: List<RecentFile>): String {
        val array = JSONArray()
        for (file in files) {
            val obj = JSONObject()
            obj.put("uri", file.uri)
            obj.put("name", file.displayName)
            obj.put("type", file.type.name)
            obj.put("lastOpenedAt", file.lastOpenedAt)
            array.put(obj)
        }
        return array.toString()
    }

    companion object {
        private const val MAX_ENTRIES = 30
    }
}
