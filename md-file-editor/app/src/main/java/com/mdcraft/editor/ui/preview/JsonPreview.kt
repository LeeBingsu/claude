package com.mdcraft.editor.ui.preview

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mdcraft.editor.R
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

@Composable
fun JsonPreview(json: String, modifier: Modifier = Modifier) {
    val formatted = remember(json) { formatJson(json) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        if (formatted.error != null) {
            Text(
                text = stringResource(R.string.editor_json_invalid, formatted.error),
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }
        Text(
            text = formatted.text,
            fontFamily = FontFamily.Monospace,
            fontSize = 14.sp
        )
    }
}

private data class FormattedJson(val text: String, val error: String?)

private fun formatJson(raw: String): FormattedJson {
    val trimmed = raw.trim()
    if (trimmed.isEmpty()) return FormattedJson("", null)
    return try {
        val pretty = if (trimmed.startsWith("[")) {
            JSONArray(trimmed).toString(2)
        } else {
            JSONObject(trimmed).toString(2)
        }
        FormattedJson(pretty, null)
    } catch (e: JSONException) {
        FormattedJson(raw, e.message ?: e.toString())
    }
}
