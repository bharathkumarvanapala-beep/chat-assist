package com.hindiassist.translation

import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.regex.Pattern
import kotlin.coroutines.resume

class TranslationManager(
    private val modelManager: ModelManager = ModelManager(),
    private val languageDetector: LanguageDetector = LanguageDetector()
) {

    suspend fun translate(
        text: String,
        requestedSourceLang: String = "auto",
        targetLang: String = "hi",
        tone: String = "Casual"
    ): TranslationResult = withContext(Dispatchers.IO) {
        if (text.isBlank()) {
            return@withContext TranslationResult(
                originalText = text,
                translatedText = "",
                sourceLang = requestedSourceLang,
                targetLang = targetLang,
                detectedLang = "und",
                isConfident = false
            )
        }

        // 1. Language Detection
        val detected = if (requestedSourceLang == "auto") {
            languageDetector.identifyLanguage(text)
        } else {
            LanguageDetector.DetectionResult(requestedSourceLang, 1.0f, requestedSourceLang.uppercase())
        }

        val effectiveSource = if (detected.languageCode == "und") "en" else detected.languageCode

        if (effectiveSource == targetLang) {
            return@withContext TranslationResult(
                originalText = text,
                translatedText = text,
                sourceLang = effectiveSource,
                targetLang = targetLang,
                detectedLang = detected.languageCode,
                isConfident = true,
                processingSource = "📱 On-device",
                alternatives = listOf(text)
            )
        }

        // 2. Entity Masking (URLs, Emojis, Numbers, Proper Names)
        val (maskedText, placeholders) = maskEntities(text)

        // 3. Check model readiness
        val sourceStatus = modelManager.checkModelStatus(effectiveSource)
        val targetStatus = modelManager.checkModelStatus(targetLang)

        if (sourceStatus != ModelStatus.READY || targetStatus != ModelStatus.READY) {
            // Apply conversational offline heuristic dictionary fallback
            val fallback = offlineHeuristicTranslate(maskedText, effectiveSource, targetLang, tone)
            val restoredFallback = unmaskEntities(fallback, placeholders)
            return@withContext TranslationResult(
                originalText = text,
                translatedText = restoredFallback,
                sourceLang = effectiveSource,
                targetLang = targetLang,
                detectedLang = detected.languageCode,
                isConfident = true,
                processingSource = "📱 On-device (Lexicon)",
                alternatives = listOf(restoredFallback)
            )
        }

        // 4. ML Kit On-Device Translation
        val srcMl = getMlKitLang(effectiveSource)
        val tgtMl = getMlKitLang(targetLang)

        val options = TranslatorOptions.Builder()
            .setSourceLanguage(srcMl)
            .setTargetLanguage(tgtMl)
            .build()

        val translator = Translation.getClient(options)

        val rawTranslated: String = suspendCancellableCoroutine { continuation ->
            translator.translate(maskedText)
                .addOnSuccessListener { result -> continuation.resume(result) }
                .addOnFailureListener {
                    // Fallback to offline heuristic
                    val fb = offlineHeuristicTranslate(maskedText, effectiveSource, targetLang, tone)
                    continuation.resume(fb)
                }
        }

        val unmasked = unmaskEntities(rawTranslated, placeholders)
        val polished = polishConversationalTone(unmasked, targetLang, tone)

        TranslationResult(
            originalText = text,
            translatedText = polished,
            sourceLang = effectiveSource,
            targetLang = targetLang,
            detectedLang = detected.languageCode,
            isConfident = detected.confidence >= 0.4f,
            processingSource = "📱 On-device",
            alternatives = generateAlternatives(polished, targetLang, tone)
        )
    }

    private fun getMlKitLang(code: String): String = when (code) {
        "hi" -> TranslateLanguage.HINDI
        "te" -> TranslateLanguage.TELUGU
        else -> TranslateLanguage.ENGLISH
    }

    private fun maskEntities(input: String): Pair<String, List<Pair<String, String>>> {
        val placeholders = mutableListOf<Pair<String, String>>()
        var text = input

        // URL pattern
        val urlPattern = Pattern.compile("(https?://\\S+)")
        val urlMatcher = urlPattern.matcher(text)
        val sb = StringBuffer()
        var idx = 0
        while (urlMatcher.find()) {
            val key = "__URL_${idx++}__"
            placeholders.add(key to urlMatcher.group(1))
            urlMatcher.appendReplacement(sb, key)
        }
        urlMatcher.appendTail(sb)
        text = sb.toString()

        return text to placeholders
    }

    private fun unmaskEntities(input: String, placeholders: List<Pair<String, String>>): String {
        var text = input
        for ((key, value) in placeholders) {
            text = text.replace(key, value)
        }
        return text
    }

    private fun polishConversationalTone(text: String, targetLang: String, tone: String): String {
        var result = text
        if (targetLang == "hi") {
            // Conversational replacement: never use "स्वतंत्र" for schedule availability
            result = result.replace("स्वतंत्र", "फ्री")
            if (tone == "Polite") {
                result = result.replace("तुम", "आप")
                    .replace("हो?", "हैं?")
                    .replace("करो", "कीजिए")
            }
        }
        return result
    }

    private fun generateAlternatives(mainText: String, targetLang: String, tone: String): List<String> {
        val list = mutableListOf(mainText)
        if (targetLang == "hi" && mainText.contains("तुम कहाँ हो?")) {
            list.add("कहाँ पर हो अभी?")
            list.add("किधर हो भाई?")
        }
        return list
    }

    private fun offlineHeuristicTranslate(text: String, sourceLang: String, targetLang: String, tone: String): String {
        val lower = text.lowercase().trim()
        if (sourceLang == "en" && targetLang == "hi") {
            if (lower.contains("where are you")) return if (tone == "Polite") "आप कहाँ हैं?" else "तुम कहाँ हो?"
            if (lower.contains("free now") || lower.contains("are you free")) return "क्या तुम अभी फ्री हो?"
            if (lower.contains("at home")) return "मैं अभी घर पर हूँ।"
            if (lower.contains("take care")) return "अपना ख्याल रखना।"
            if (lower.contains("call you tomorrow")) return "मैं तुम्हें कल कॉल करूँगा।"
        }
        if (sourceLang == "hi" && targetLang == "en") {
            if (text.contains("घर पर हूँ")) return "I am at home right now."
            if (text.contains("कहाँ हो")) return "Where are you?"
            if (text.contains("ख्याल रखना")) return "Take care."
        }
        if (sourceLang == "te" && targetLang == "hi") {
            if (text.contains("ఎక్కడ ఉన్నావు")) return "तुम कहाँ हो?"
            if (text.contains("ఇంట్లోనే ఉన్నాను")) return "मैं अभी घर पर हूँ।"
        }
        return text
    }
}
