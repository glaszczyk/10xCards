#!/bin/bash

# 10xCards Configuration Switcher
# Pozwala przełączać między różnymi konfiguracjami środowiska

CONFIG_DIR=".config"
ENV_FILE=".env"

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do wyświetlania pomocy
show_help() {
    echo "🔄 10xCards Configuration Switcher"
    echo "=================================="
    echo ""
    echo "Użycie:"
    echo "  $0 [config_name]                    # Przełącz na konkretną konfigurację"
    echo "  $0 list                             # Pokaż dostępne konfiguracje"
    echo "  $0 create [name] [type]             # Utwórz nową konfigurację"
    echo "  $0 delete [name]                    # Usuń konfigurację"
    echo "  $0 backup                           # Utwórz backup aktualnej konfiguracji"
    echo "  $0 restore [backup_file]            # Przywróć z backupu"
    echo ""
    echo "Dostępne typy konfiguracji:"
    echo "  mock        - Używa mock data (bez bazy danych)"
    echo "  supabase    - Używa Supabase (wymaga SUPABASE_URL i SUPABASE_ANON_KEY)"
    echo "  auto        - Auto-detection (Supabase jeśli skonfigurowane, inaczej mock)"
    echo ""
    echo "Przykłady:"
    echo "  $0 mock                             # Przełącz na mock"
    echo "  $0 supabase                         # Przełącz na Supabase"
    echo "  $0 create dev supabase              # Utwórz konfigurację 'dev' typu supabase"
    echo "  $0 list                             # Pokaż wszystkie konfiguracje"
    echo ""
}

# Funkcja do wyświetlania wyników
print_result() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Funkcja do tworzenia katalogu konfiguracji
ensure_config_dir() {
    if [ ! -d "$CONFIG_DIR" ]; then
        mkdir -p "$CONFIG_DIR"
        print_result "success" "Created config directory: $CONFIG_DIR"
    fi
}

# Funkcja do sprawdzania i tworzenia .env jeśli nie istnieje
ensure_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_result "warning" "No .env file found, creating default configuration"
        create_auto_config
        cp "$CONFIG_DIR/auto.env" "$ENV_FILE"
        print_result "success" "Created default .env file with auto-detection"
    fi
}

# Funkcja do tworzenia konfiguracji mock
create_mock_config() {
    cat > "$CONFIG_DIR/mock.env" << 'EOF'
# Mock Data Configuration
# Uses in-memory mock data for development and testing
DATA_PROVIDER=mock

# No database connection needed
# SUPABASE_URL=
# SUPABASE_ANON_KEY=

# Optional: AI integration
# OPENROUTER_API_KEY=your_openrouter_api_key
EOF
}

# Funkcja do tworzenia konfiguracji Supabase
create_supabase_config() {
    cat > "$CONFIG_DIR/supabase.env" << 'EOF'
# Supabase Configuration
# Uses Supabase as the data provider
DATA_PROVIDER=supabase

# Supabase Configuration
# Get these values from your Supabase project dashboard
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI integration
# OPENROUTER_API_KEY=your_openrouter_api_key
EOF
}

# Funkcja do tworzenia konfiguracji auto
create_auto_config() {
    cat > "$CONFIG_DIR/auto.env" << 'EOF'
# Auto-detection Configuration
# Automatically detects and uses Supabase if configured, otherwise falls back to mock
DATA_PROVIDER=

# Supabase Configuration (optional - will use mock if not provided)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI integration
# OPENROUTER_API_KEY=your_openrouter_api_key
EOF
}

# Funkcja do tworzenia domyślnych konfiguracji
create_default_configs() {
    ensure_config_dir
    
    if [ ! -f "$CONFIG_DIR/mock.env" ]; then
        create_mock_config
        print_result "success" "Created mock configuration"
    fi
    
    if [ ! -f "$CONFIG_DIR/supabase.env" ]; then
        create_supabase_config
        print_result "success" "Created supabase configuration template"
    fi
    
    if [ ! -f "$CONFIG_DIR/auto.env" ]; then
        create_auto_config
        print_result "success" "Created auto-detection configuration"
    fi
}

# Funkcja do listowania konfiguracji
list_configs() {
    ensure_config_dir
    create_default_configs
    ensure_env_file
    
    echo -e "${BLUE}Available configurations:${NC}"
    echo ""
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}📁 Current (.env):${NC}"
        echo "  $(basename "$ENV_FILE")"
        current_type=$(grep '^DATA_PROVIDER=' "$ENV_FILE" | cut -d'=' -f2 || echo 'auto')
        echo "  Type: $current_type"
        echo ""
    fi
    
    echo -e "${BLUE}📁 Stored configurations:${NC}"
    for config in "$CONFIG_DIR"/*.env; do
        if [ -f "$config" ]; then
            config_name=$(basename "$config" .env)
            echo "  $config_name"
        fi
    done
    
    echo ""
    echo -e "${YELLOW}💡 Tip: Use '$0 [config_name]' to switch to a configuration${NC}"
}

# Funkcja do przełączania konfiguracji
switch_config() {
    local config_name="$1"
    local config_file="$CONFIG_DIR/$config_name.env"
    
    ensure_config_dir
    create_default_configs
    
    if [ ! -f "$config_file" ]; then
        print_result "error" "Configuration '$config_name' not found"
        echo ""
        echo "Available configurations:"
        for config in "$CONFIG_DIR"/*.env; do
            if [ -f "$config" ]; then
                echo "  $(basename "$config" .env)"
            fi
        done
        exit 1
    fi
    
    # Utwórz backup aktualnej konfiguracji
    if [ -f "$ENV_FILE" ]; then
        backup_file="$CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S).env"
        cp "$ENV_FILE" "$backup_file"
        print_result "success" "Backed up current configuration to $(basename "$backup_file")"
    fi
    
    # Skopiuj nową konfigurację
    cp "$config_file" "$ENV_FILE"
    print_result "success" "Switched to '$config_name' configuration"
    
    # Pokaż informacje o konfiguracji
    echo ""
    echo -e "${BLUE}Configuration details:${NC}"
    echo "  File: $ENV_FILE"
    echo "  Type: $(grep '^DATA_PROVIDER=' "$ENV_FILE" | cut -d'=' -f2 || echo 'auto')"
    
    if grep -q "SUPABASE_URL=your_supabase_project_url" "$ENV_FILE"; then
        echo -e "${YELLOW}⚠️  Remember to update SUPABASE_URL and SUPABASE_ANON_KEY in .env${NC}"
    fi
}

# Funkcja do tworzenia nowej konfiguracji
create_config() {
    local config_name="$1"
    local config_type="$2"
    
    if [ -z "$config_name" ] || [ -z "$config_type" ]; then
        print_result "error" "Usage: $0 create [name] [type]"
        echo "Types: mock, supabase, auto"
        exit 1
    fi
    
    ensure_config_dir
    
    case "$config_type" in
        "mock")
            create_mock_config
            mv "$CONFIG_DIR/mock.env" "$CONFIG_DIR/$config_name.env"
            print_result "success" "Created mock configuration: $config_name"
            ;;
        "supabase")
            create_supabase_config
            mv "$CONFIG_DIR/supabase.env" "$CONFIG_DIR/$config_name.env"
            print_result "success" "Created supabase configuration: $config_name"
            ;;
        "auto")
            create_auto_config
            mv "$CONFIG_DIR/auto.env" "$CONFIG_DIR/$config_name.env"
            print_result "success" "Created auto-detection configuration: $config_name"
            ;;
        *)
            print_result "error" "Invalid type: $config_type"
            echo "Valid types: mock, supabase, auto"
            exit 1
            ;;
    esac
}

# Funkcja do usuwania konfiguracji
delete_config() {
    local config_name="$1"
    local config_file="$CONFIG_DIR/$config_name.env"
    
    if [ -z "$config_name" ]; then
        print_result "error" "Usage: $0 delete [name]"
        exit 1
    fi
    
    if [ ! -f "$config_file" ]; then
        print_result "error" "Configuration '$config_name' not found"
        exit 1
    fi
    
    rm "$config_file"
    print_result "success" "Deleted configuration: $config_name"
}

# Funkcja do tworzenia backupu
backup_config() {
    if [ ! -f "$ENV_FILE" ]; then
        print_result "error" "No .env file to backup"
        exit 1
    fi
    
    ensure_config_dir
    backup_file="$CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S).env"
    cp "$ENV_FILE" "$backup_file"
    print_result "success" "Backup created: $(basename "$backup_file")"
}

# Funkcja do przywracania z backupu
restore_config() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_result "error" "Usage: $0 restore [backup_file]"
        echo ""
        echo "Available backups:"
        for backup in "$CONFIG_DIR"/backup_*.env; do
            if [ -f "$backup" ]; then
                echo "  $(basename "$backup")"
            fi
        done
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        # Sprawdź czy plik jest w katalogu backup
        backup_file="$CONFIG_DIR/$backup_file"
        if [ ! -f "$backup_file" ]; then
            print_result "error" "Backup file not found: $backup_file"
            exit 1
        fi
    fi
    
    cp "$backup_file" "$ENV_FILE"
    print_result "success" "Restored configuration from: $(basename "$backup_file")"
}

# Główna logika
case "$1" in
    "list")
        list_configs
        ;;
    "create")
        create_config "$2" "$3"
        ;;
    "delete")
        delete_config "$2"
        ;;
    "backup")
        backup_config
        ;;
    "restore")
        restore_config "$2"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        # Przełącz na konfigurację
        switch_config "$1"
        ;;
esac 