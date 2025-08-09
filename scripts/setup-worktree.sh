#!/usr/bin/env bash

# Simplified Git Worktree Setup Script  
# Usage: ./setup-worktree.sh [worktree-name]
# If no worktree-name provided, assumes script is run from within a worktree
# If worktree-name provided, sets up that specific worktree

# Strict mode for better error handling and debugging
set -euo pipefail

# --- Configuration ---
# Directories that should be symlinked from main project to worktree
readonly LINK_DIRS=(
    "node_modules"
    ".next"
    "dist" 
    "build"
    "coverage"
)

# Files that should be symlinked from main project to worktree
readonly LINK_FILES=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    ".eslintrc.json"
    "jest.config.js"
    "next.config.js"
    "postcss.config.js"
    "tailwind.config.js"
    "playwright.config.js"
    ".env"
    ".env.local"
)

# Config directories to symlink (with nested structure)
readonly LINK_CONFIG_DIRS=(
    "src/config"
)

# --- Helper Functions ---
print_info() { echo "ℹ️  $1"; }
print_success() { echo "✅ $1"; }
print_error() { echo "❌ $1"; }

# --- Main Function ---
main() {
    local worktree_name="${1:-}"
    
    print_info "Starting Git Worktree setup..."
    
    # 1. Determine paths
    local WORKTREE_ROOT
    local MAIN_PROJECT_ROOT
    
    # Get main project root
    MAIN_PROJECT_ROOT=$(git rev-parse --show-toplevel)
    
    if [[ -n "$worktree_name" ]]; then
        # Specific worktree name provided - find its path
        local worktree_path
        if ! worktree_path=$(git worktree list --porcelain | grep -A1 "branch refs/heads/$worktree_name" | grep "worktree " | cut -d' ' -f2); then
            # Fallback: assume standard naming convention
            worktree_path="../EndgameTrainer-$worktree_name"
        fi
        
        if [[ -z "$worktree_path" || ! -d "$worktree_path" ]]; then
            print_error "Worktree for '$worktree_name' not found"
            print_info "Available worktrees:"
            git worktree list
            exit 1
        fi
        
        WORKTREE_ROOT=$(realpath "$worktree_path")
    else
        # No worktree name provided - use current directory
        WORKTREE_ROOT=$(pwd)
        
        # Verify we're in a worktree, not the main project
        if [[ "$WORKTREE_ROOT" == "$MAIN_PROJECT_ROOT" ]]; then
            print_error "Please specify a worktree name or run from within a worktree"
            print_info "Usage: $0 [worktree-name]"
            exit 1
        fi
    fi
    
    print_info "Main project: ${MAIN_PROJECT_ROOT}"
    print_info "Worktree: ${WORKTREE_ROOT}"
    
    # 2. Create symlinks for directories
    print_info "Creating directory symlinks..."
    for dir in "${LINK_DIRS[@]}"; do
        local SOURCE_PATH="${MAIN_PROJECT_ROOT}/${dir}"
        local DEST_PATH="${WORKTREE_ROOT}/${dir}"
        
        if [[ ! -d "${SOURCE_PATH}" ]]; then
            print_info "Skipping '${dir}' - not found in main project"
            continue
        fi
        
        # Remove existing file/directory/link to avoid conflicts
        rm -rf "${DEST_PATH}"
        
        # Create relative symlink
        local RELATIVE_SOURCE
        RELATIVE_SOURCE=$(realpath --relative-to="${WORKTREE_ROOT}" "${SOURCE_PATH}")
        
        ln -s "${RELATIVE_SOURCE}" "${DEST_PATH}"
        print_success "Directory linked: ${dir} -> ${RELATIVE_SOURCE}"
    done
    
    # 3. Create symlinks for files
    print_info "Creating file symlinks..."
    for file in "${LINK_FILES[@]}"; do
        local SOURCE_PATH="${MAIN_PROJECT_ROOT}/${file}"
        local DEST_PATH="${WORKTREE_ROOT}/${file}"
        
        if [[ ! -f "${SOURCE_PATH}" ]]; then
            print_info "Skipping '${file}' - not found in main project"
            continue
        fi
        
        rm -f "${DEST_PATH}"
        
        local RELATIVE_SOURCE
        RELATIVE_SOURCE=$(realpath --relative-to="${WORKTREE_ROOT}" "${SOURCE_PATH}")
        
        ln -s "${RELATIVE_SOURCE}" "${DEST_PATH}"
        print_success "File linked: ${file} -> ${RELATIVE_SOURCE}"
    done
    
    # 4. Create symlinks for config directories (nested paths)
    print_info "Creating config directory symlinks..."
    for config_dir in "${LINK_CONFIG_DIRS[@]}"; do
        local SOURCE_PATH="${MAIN_PROJECT_ROOT}/${config_dir}"
        local DEST_PATH="${WORKTREE_ROOT}/${config_dir}"
        
        if [[ ! -d "${SOURCE_PATH}" ]]; then
            print_info "Skipping '${config_dir}' - not found in main project"
            continue
        fi
        
        # Ensure parent directory exists
        mkdir -p "$(dirname "${DEST_PATH}")"
        
        rm -rf "${DEST_PATH}"
        
        local RELATIVE_SOURCE
        RELATIVE_SOURCE=$(realpath --relative-to="$(dirname "${DEST_PATH}")" "${SOURCE_PATH}")
        
        ln -s "${RELATIVE_SOURCE}" "${DEST_PATH}"
        print_success "Config directory linked: ${config_dir} -> ${RELATIVE_SOURCE}"
    done
    
    # 5. Create .nvmrc file
    print_info "Creating .nvmrc..."
    if [[ -f "${MAIN_PROJECT_ROOT}/.nvmrc" ]]; then
        cp "${MAIN_PROJECT_ROOT}/.nvmrc" "${WORKTREE_ROOT}/.nvmrc"
        print_success "Copied .nvmrc from main project"
    else
        echo "22.17.0" > "${WORKTREE_ROOT}/.nvmrc"
        print_success "Created .nvmrc with Node 22.17.0"
    fi
    
    # 6. Setup VS Code configuration
    print_info "Setting up VS Code..."
    mkdir -p "${WORKTREE_ROOT}/.vscode"
    
    cat > "${WORKTREE_ROOT}/.vscode/settings.json" << 'VSCODE'
{
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "eslint.workingDirectories": [
        { "mode": "auto" }
    ],
    "eslint.validate": [
        "javascript",
        "javascriptreact", 
        "typescript",
        "typescriptreact"
    ],
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "files.exclude": {
        "node_modules": false,
        ".next": true,
        "coverage": true,
        "dist": true,
        "build": true
    },
    "search.exclude": {
        "node_modules": true,
        ".next": true,
        "coverage": true,
        "dist": true,
        "build": true,
        ".jest-cache": true
    },
    "typescript.preferences.includePackageJsonAutoImports": "auto"
}
VSCODE
    
    # Copy extensions if they exist
    if [[ -f "${MAIN_PROJECT_ROOT}/.vscode/extensions.json" ]]; then
        cp "${MAIN_PROJECT_ROOT}/.vscode/extensions.json" "${WORKTREE_ROOT}/.vscode/"
        print_success "Copied VS Code extensions recommendations"
    fi
    
    # 7. Create comprehensive .gitignore for worktree
    print_info "Creating worktree-specific .gitignore..."
    {
        echo "# Auto-generated by setup-worktree.sh"
        echo "# Prevents accidentally committing symlinked files/directories"
        echo ""
        echo "# Symlinked directories"
        for dir in "${LINK_DIRS[@]}"; do
            echo "/${dir}/"
        done
        echo ""
        echo "# Symlinked files"  
        for file in "${LINK_FILES[@]}"; do
            echo "/${file}"
        done
        echo ""
        echo "# Symlinked config directories"
        for config_dir in "${LINK_CONFIG_DIRS[@]}"; do
            echo "/${config_dir}/"
        done
        echo ""
        echo "# IDE files"
        echo ".vscode/"
        echo ".idea/"
        echo "*.swp"
        echo "*.swo" 
        echo ""
        echo "# OS files"
        echo ".DS_Store"
        echo "Thumbs.db"
        echo ""
        echo "# Temporary files"
        echo "*.tmp"
        echo "*.temp"
        echo ".cache"
        echo ""
        echo "# Jest cache"
        echo ".jest-cache/"
        echo ""
        echo "# Firebase & PM2 logs"
        echo "firebase-debug.log*"
        echo "firestore-debug.log*"
        echo "logs/"
    } > "${WORKTREE_ROOT}/.gitignore"
    
    print_success "Created comprehensive .gitignore"
    
    print_success "Worktree setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "  1. nvm use (to switch to correct Node version)"
    echo "  2. code . (to open in VS Code)"
    echo "  3. npm test (to verify everything works)"
    echo
    print_info "The worktree is ready for development!"
}

# Execute main function
main "$@"