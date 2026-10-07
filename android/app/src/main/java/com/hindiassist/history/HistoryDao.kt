package com.hindiassist.history

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface HistoryDao {

    @Query("SELECT * FROM translation_history ORDER BY timestamp DESC")
    fun getAllHistory(): Flow<List<TranslationHistory>>

    @Query("SELECT * FROM translation_history WHERE timestamp >= :startOfDay ORDER BY timestamp DESC")
    fun getTodayHistory(startOfDay: Long): Flow<List<TranslationHistory>>

    @Query("SELECT * FROM translation_history WHERE isFavorite = 1 ORDER BY timestamp DESC")
    fun getFavorites(): Flow<List<TranslationHistory>>

    @Query("SELECT * FROM translation_history WHERE direction = :direction ORDER BY timestamp DESC")
    fun getByDirection(direction: String): Flow<List<TranslationHistory>>

    @Query("SELECT * FROM translation_history WHERE originalText LIKE '%' || :query || '%' OR translatedText LIKE '%' || :query || '%' ORDER BY timestamp DESC")
    fun searchHistory(query: String): Flow<List<TranslationHistory>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: TranslationHistory): Long

    @Update
    suspend fun update(item: TranslationHistory)

    @Delete
    suspend fun delete(item: TranslationHistory)

    @Query("DELETE FROM translation_history WHERE timestamp >= :startOfDay")
    suspend fun deleteToday(startOfDay: Long)

    @Query("DELETE FROM translation_history")
    suspend fun deleteAll()
}
