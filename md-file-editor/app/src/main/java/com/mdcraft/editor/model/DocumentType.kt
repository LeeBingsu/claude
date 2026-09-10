package com.mdcraft.editor.model

/** File formats this app can create, view and edit. */
enum class DocumentType(
    val label: String,
    val extension: String,
    val mimeType: String,
    val template: String
) {
    MARKDOWN("Markdown", "md", "text/markdown", "# 제목\n\n내용을 입력하세요.\n"),
    JSON("JSON", "json", "application/json", "{\n  \"key\": \"value\"\n}\n"),
    HTML("HTML", "html", "text/html", "<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>제목</title>\n</head>\n<body>\n  <h1>제목</h1>\n</body>\n</html>\n"),
    TEXT("텍스트", "txt", "text/plain", "");

    companion object {
        /** Determines type from a file name's extension, defaulting to plain text. */
        fun fromFileName(name: String): DocumentType {
            val ext = name.substringAfterLast('.', "").lowercase()
            return when (ext) {
                "md", "markdown" -> MARKDOWN
                "json" -> JSON
                "html", "htm" -> HTML
                else -> TEXT
            }
        }

        /** Determines type from a mime type, falling back to the file name. */
        fun fromMimeType(mimeType: String?, fileName: String): DocumentType {
            return when (mimeType) {
                "text/markdown", "text/x-markdown" -> MARKDOWN
                "application/json" -> JSON
                "text/html" -> HTML
                "text/plain" -> if (fileName.isNotBlank()) fromFileName(fileName) else TEXT
                else -> fromFileName(fileName)
            }
        }
    }
}
