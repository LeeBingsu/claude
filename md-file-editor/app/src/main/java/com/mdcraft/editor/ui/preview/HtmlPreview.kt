package com.mdcraft.editor.ui.preview

import android.annotation.SuppressLint
import android.net.Uri
import android.webkit.WebView
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import java.io.File

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
        update = { webView ->
            // loadDataWithBaseURL ships the whole string across the Binder
            // IPC boundary to WebView's renderer process in one transaction;
            // past ~1MB that throws TransactionTooLargeException and kills
            // the app outright. Writing to a file and loading it by file://
            // URL has no such limit since the renderer reads it off disk.
            val file = File(webView.context.cacheDir, "html_preview.html")
            file.writeText(html, Charsets.UTF_8)
            webView.loadUrl(Uri.fromFile(file).toString())
        }
    )
}
