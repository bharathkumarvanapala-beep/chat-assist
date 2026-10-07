package com.hindiassist.translation

import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.languageid.LanguageIdentifier
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class LanguageDetector {

    private val identifier: LanguageIdentifier = LanguageIdentification.getClient()

    suspend fun identifyLanguage(text: String): DetectionResult {
        if (text.isBlank()) {
            return DetectionResult("und", 0.0f, "Language uncertain.")
        }

        // Fast Unicode script heuristics
        val devanagariCount = text.count { it in '\u0900'..'\u097F' }
        val teluguCount = text.count { it in '\u0C00'..'\u0C7F' }
        val latinCount = text.count { it in 'a'..'z' || it in 'A'..'Z' }

        if (devanagariCount > 0 && devanagariCount >= teluguCount && devanagariCount >= latinCount * 0.4) {
            return DetectionResult("hi", 0.95f, "Hindi")
        }
        if (teluguCount > 0 && teluguCount >= devanagariCount && teluguCount >= latinCount * 0.4) {
            return DetectionResult("te", 0.95f, "Telugu")
        }

        // ML Kit Identification fallback
        return suspendCancellableCoroutine { continuation ->
            identifier.identifyLanguage(text)
                .addOnSuccessListener { languageCode ->
                    if (languageCode == "und" || languageCode.isBlank()) {
                        continuation.resume(DetectionResult("und", 0.2f, "Language uncertain."))
                    } else {
                        val label = when (languageCode) {
                            "en" -> "English"
                            "hi" -> "Hindi"
                            "te" -> "Telugu"
                            else -> "Language uncertain."
                        }
                        continuation.resume(DetectionResult(languageCode, 0.9f, label))
                    }
                }
                .addOnFailureListener {
                    continuation.resume(DetectionResult("und", 0.0f, "Language uncertain."))
                }
        }
    }

    data class DetectionResult(
        val languageCode: String,
        val confidence: Float,
        val displayLabel: String
    )
}
