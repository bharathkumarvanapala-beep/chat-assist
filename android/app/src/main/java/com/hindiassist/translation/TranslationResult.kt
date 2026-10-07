package com.hindiassist.translation

data class TranslationResult(
    val originalText: String,
    val translatedText: String,
    val sourceLang: String,
    val targetLang: String,
    val detectedLang: String,
    val isConfident: Boolean,
    val processingSource: String = "📱 On-device",
    val alternatives: List<String> = emptyList(),
    val errorMessage: String? = null
)
