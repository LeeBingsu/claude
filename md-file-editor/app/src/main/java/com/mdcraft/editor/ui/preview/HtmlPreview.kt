package com.mdcraft.editor.ui.preview

import android.annotation.SuppressLint
import android.webkit.WebView
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun HtmlPreview(html: String, modifier: Modifier = Modifier) {
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { ctx ->
            WebView(ctx).apply {
                // The user's own local markup, run live as they edit it, so
                // scripts execute the same way they would in a browser tab.
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.useWideViewPort = true
                settings.loadWithOverviewMode = true
            }
        },
        update = { webView -> webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null) }
    )
}
