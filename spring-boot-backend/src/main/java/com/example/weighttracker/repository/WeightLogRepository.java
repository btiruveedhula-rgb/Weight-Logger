package com.example.weighttracker.repository;

import com.example.weighttracker.model.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeightLogRepository extends JpaRepository<WeightLog, Long> {

    // Retrieve records sorted chronologically descending
    List<WeightLog> findAllByOrderByLoggedAtDesc();

    // SQL Aggregation query for summary statistics
    @Query(value = "SELECT COUNT(*) AS totalEntries, MIN(weight) AS minWeight, MAX(weight) AS maxWeight, AVG(weight) AS avgWeight FROM weight_logs", nativeQuery = true)
    Object[] getWeightStats();
}
