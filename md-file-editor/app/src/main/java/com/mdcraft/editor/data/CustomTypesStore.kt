package com.mdcraft.editor.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONArray

private val Context.customTypesDataStore by preferencesDataStore(name = "custom_types")

/** Persists file extensions the user has defined beyond the four built-in types. */
class CustomTypesStore(private val context: Context) {

    private val key = stringPreferencesKey("custom_extensions_json")

    val customExtensions: Flow<List<String>> = context.customTypesDataStore.data.map { prefs ->
        parse(prefs[key].orEmpty())
    }

    suspend fun add(extension: String) {
        context.customTypesDataStore.edit { prefs ->
            val current = parse(prefs[key].orEmpty()).toMutableList()
            if (!current.contains(extension)) current.add(extension)
            prefs[key] = serialize(current)
        }
    }

    suspend fun remove(extension: String) {
        context.customTypesDataStore.edit { prefs ->
            val current = parse(prefs[key].orEmpty()).filterNot { it == extension }
            prefs[key] = serialize(current)
        }
    }

    private fun parse(json: String): List<String> {
        if (json.isBlank()) return emptyList()
        return try {
            val array = JSONArray(json)
            buildList { for (i in 0 until array.length()) add(array.getString(i)) }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun serialize(extensions: List<String>): String {
        val array = JSONArray()
        extensions.forEach { array.put(it) }
        return array.toString()
    }
}
