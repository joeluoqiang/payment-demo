package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// DemoRecording represents a recorded demo session
type DemoRecording struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Steps       []Step    `json:"steps"`
	Duration    int64     `json:"duration"` // in milliseconds
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	ShareURL    string    `json:"shareUrl"`
}

// Step represents a single step in a demo recording
type Step struct {
	Timestamp int64       `json:"timestamp"`
	Action    string      `json:"action"`
	Data      interface{} `json:"data,omitempty"`
}

var (
	db   *sql.DB
	once sync.Once
)

// InitDB initializes the SQLite database
func InitDB() error {
	var initErr error
	once.Do(func() {
		// Create data directory if it doesn't exist
		if err := os.MkdirAll("data", 0755); err != nil {
			initErr = fmt.Errorf("failed to create data directory: %w", err)
			return
		}

		// Open database connection
		db, initErr = sql.Open("sqlite3", "data/demo.db")
		if initErr != nil {
			return
		}

		// Create table if not exists
		createTableSQL := `
		CREATE TABLE IF NOT EXISTS demo_recordings (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			steps TEXT NOT NULL,
			duration INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			share_url TEXT
		);`

		_, initErr = db.Exec(createTableSQL)
		if initErr != nil {
			initErr = fmt.Errorf("failed to create table: %w", initErr)
			return
		}

		log.Println("Database initialized successfully")
	})

	return initErr
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	if db == nil {
		if err := InitDB(); err != nil {
			log.Fatalf("Failed to initialize database: %v", err)
		}
	}
	return db
}

// SaveRecording saves a demo recording to the database
func SaveRecording(recording *DemoRecording) error {
	if err := InitDB(); err != nil {
		return err
	}

	stepsJSON, err := json.Marshal(recording.Steps)
	if err != nil {
		return fmt.Errorf("failed to marshal steps: %w", err)
	}

	now := time.Now()
	query := `
		INSERT INTO demo_recordings (id, name, description, steps, duration, created_at, updated_at, share_url)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			description = excluded.description,
			steps = excluded.steps,
			duration = excluded.duration,
			updated_at = excluded.updated_at,
			share_url = excluded.share_url
	`

	_, err = GetDB().Exec(query,
		recording.ID,
		recording.Name,
		recording.Description,
		string(stepsJSON),
		recording.Duration,
		now,
		now,
		recording.ShareURL,
	)

	return err
}

// GetRecording retrieves a recording by ID
func GetRecording(id string) (*DemoRecording, error) {
	if err := InitDB(); err != nil {
		return nil, err
	}

	query := `SELECT id, name, description, steps, duration, created_at, updated_at, share_url
			  FROM demo_recordings WHERE id = ?`

	row := GetDB().QueryRow(query, id)

	var recording DemoRecording
	var stepsJSON string
	var createdAt, updatedAt string

	err := row.Scan(
		&recording.ID,
		&recording.Name,
		&recording.Description,
		&stepsJSON,
		&recording.Duration,
		&createdAt,
		&updatedAt,
		&recording.ShareURL,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("recording not found")
		}
		return nil, err
	}

	// Parse steps
	if err := json.Unmarshal([]byte(stepsJSON), &recording.Steps); err != nil {
		return nil, fmt.Errorf("failed to unmarshal steps: %w", err)
	}

	// Parse timestamps
	if recording.CreatedAt, err = time.Parse("2006-01-02 15:04:05", createdAt); err != nil {
		recording.CreatedAt = time.Now()
	}
	if recording.UpdatedAt, err = time.Parse("2006-01-02 15:04:05", updatedAt); err != nil {
		recording.UpdatedAt = time.Now()
	}

	return &recording, nil
}

// ListRecordings lists all recordings
func ListRecordings(limit, offset int) ([]DemoRecording, error) {
	if err := InitDB(); err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 50
	}

	query := `SELECT id, name, description, steps, duration, created_at, updated_at, share_url
			  FROM demo_recordings ORDER BY created_at DESC LIMIT ? OFFSET ?`

	rows, err := GetDB().Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recordings []DemoRecording
	for rows.Next() {
		var recording DemoRecording
		var stepsJSON string
		var createdAt, updatedAt string

		err := rows.Scan(
			&recording.ID,
			&recording.Name,
			&recording.Description,
			&stepsJSON,
			&recording.Duration,
			&createdAt,
			&updatedAt,
			&recording.ShareURL,
		)

		if err != nil {
			log.Printf("Error scanning recording: %v", err)
			continue
		}

		// Parse steps
		if err := json.Unmarshal([]byte(stepsJSON), &recording.Steps); err != nil {
			log.Printf("Error unmarshaling steps: %v", err)
			continue
		}

		// Parse timestamps
		if recording.CreatedAt, err = time.Parse("2006-01-02 15:04:05", createdAt); err != nil {
			recording.CreatedAt = time.Now()
		}
		if recording.UpdatedAt, err = time.Parse("2006-01-02 15:04:05", updatedAt); err != nil {
			recording.UpdatedAt = time.Now()
		}

		recordings = append(recordings, recording)
	}

	return recordings, nil
}

// DeleteRecording deletes a recording by ID
func DeleteRecording(id string) error {
	if err := InitDB(); err != nil {
		return err
	}

	query := `DELETE FROM demo_recordings WHERE id = ?`
	_, err := GetDB().Exec(query, id)
	return err
}

// CloseDB closes the database connection
func CloseDB() error {
	if db != nil {
		return db.Close()
	}
	return nil
}