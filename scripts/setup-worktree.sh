#!/usr/bin/env bash

# Git Worktree Setup Script for pnpm
# Optimized for pnpm's global store architecture
# Usage: ./setup-worktree-pnpm.sh [worktree-name]

set -euo pipefail

# --- Configuration ---

# Directories that should be symlinked (NOT node_modules!)
readonly LINK_DIRS=(
    ".next"
    "dist" 
    "build"
    "coverage"
    "playwright-report"
    "test-results"
)

# Files that should be symlinked from main project
readonly LINK_FILES=(
    "package.json"
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"  # if using workspaces
    ".npmrc"               # pnpm config
    "tsconfig.json"
    ".eslintrc.json"
    "jest.config.js"
    "vitest.config.ts"
    "next.config.js"
    "postcss.config.js"
    "tailwind.config.js"
    "playwright.config.js"
    ".env"
    ".env.local"
)

# Config directories to symlink
readonly LINK_CONFIG_DIRS=(
    "src/config"
)

# pnpm store configuration
readonly PNPM_STORE_DIR="${PNPM_STORE_DIR:-$HOME/.pnpm-store}"

# --- Helper Functions ---
print_info() { echo "ℹ️  $1"; }
print_success() { echo "✅ $1"; }
print_error() { echo "❌ $1"; }
print_warning() { echo "⚠️  $1"; }

# Check if pnpm is installed
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed!"
        print_info "Install with: npm install -g pnpm"
        exit 1
    fi
    print_success "pnpm found: $(pnpm --version)"
}

# Configure pnpm store location
configure_pnpm_store() {
    local worktree_root="$1"
    
    print_info "Configuring pnpm store location: $PNPM_STORE_DIR"
    
    # Create .npmrc in worktree with store configuration
    cat > "${worktree_root}/.npmrc" << EOF
# pnpm configuration for worktree
store-dir=${PNPM_STORE_DIR}
shared-workspace-lockfile=true
link-workspace-packages=true
prefer-workspace-packages=true
auto-install-peers=true
strict-peer-dependencies=false
EOF
    
    print_success "pnpm store configured at: $PNPM_STORE_DIR"
}

# --- Main Function ---
main() {
    local worktree_name="${1:-}"
    
    print_info "Starting Git Worktree setup for pnpm..."
    
    # Check pnpm installation
    check_pnpm
    
    # 1. Determine paths
    local WORKTREE_ROOT
    local MAIN_PROJECT_ROOT
    
    MAIN_PROJECT_ROOT=$(git rev-parse --show-toplevel)
    
    if [[ -n "$worktree_name" ]]; then
        # Specific worktree name provided
        local worktree_path
        if ! worktree_path=$(git worktree list --porcelain | grep -A1 "branch refs/heads/$worktree_name" | grep "worktree " | cut -d' ' -f2); then
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
        WORKTREE_ROOT=$(pwd)
        
        if [[ "$WORKTREE_ROOT" == "$MAIN_PROJECT_ROOT" ]]; then
            print_error "Please specify a worktree name or run from within a worktree"
            print_info "Usage: $0 [worktree-name]"
            exit 1
        fi
    fi
    
    print_info "Main project: ${MAIN_PROJECT_ROOT}"
    print_info "Worktree: ${WORKTREE_ROOT}"
    
    # 2. Configure pnpm store
    configure_pnpm_store "$WORKTREE_ROOT"
    
    # 3. Create symlinks for directories (NOT node_modules!)
    print_info "Creating directory symlinks (excluding node_modules)..."
    for dir in "${LINK_DIRS[@]}"; do
        local SOURCE_PATH="${MAIN_PROJECT_ROOT}/${dir}"
        local DEST_PATH="${WORKTREE_ROOT}/${dir}"
        
        if [[ ! -d "${SOURCE_PATH}" ]]; then
            print_info "Skipping '${dir}' - not found in main project"
            continue
        fi
        
        rm -rf "${DEST_PATH}"
        
        local RELATIVE_SOURCE
        RELATIVE_SOURCE=$(realpath --relative-to="${WORKTREE_ROOT}" "${SOURCE_PATH}")
        
        ln -s "${RELATIVE_SOURCE}" "${DEST_PATH}"
        print_success "Directory linked: ${dir} -> ${RELATIVE_SOURCE}"
    done
    
    # 4. Create symlinks for files
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
    
    # 5. Create symlinks for config directories
    print_info "Creating config directory symlinks..."
    for config_dir in "${LINK_CONFIG_DIRS[@]}"; do
        local SOURCE_PATH="${MAIN_PROJECT_ROOT}/${config_dir}"
        local DEST_PATH="${WORKTREE_ROOT}/${config_dir}"
        
        if [[ ! -d "${SOURCE_PATH}" ]]; then
            print_info "Skipping '${config_dir}' - not found in main project"
            continue
        fi
        
        mkdir -p "$(dirname "${DEST_PATH}")"
        rm -rf "${DEST_PATH}"
        
        local RELATIVE_SOURCE
        RELATIVE_SOURCE=$(realpath --relative-to="$(dirname "${DEST_PATH}")" "${SOURCE_PATH}")
        
        ln -s "${RELATIVE_SOURCE}" "${DEST_PATH}"
        print_success "Config directory linked: ${config_dir} -> ${RELATIVE_SOURCE}"
    done
    
    # 6. Run pnpm install in worktree
    print_info "Running pnpm install in worktree..."
    print_info "This will use the global store at: $PNPM_STORE_DIR"
    
    cd "${WORKTREE_ROOT}"
    
    # Remove old node_modules if it exists (in case switching from npm)
    if [[ -d "node_modules" ]] && [[ ! -L "node_modules" ]]; then
        print_warning "Removing old node_modules directory..."
        rm -rf node_modules
    fi
    
    # Run pnpm install
    if pnpm install --frozen-lockfile; then
        print_success "pnpm install completed successfully"
    else
        print_warning "pnpm install with frozen-lockfile failed, trying without..."
        pnpm install
    fi
    
    # 7. Create .nvmrc file
    print_info "Creating .nvmrc..."
    if [[ -f "${MAIN_PROJECT_ROOT}/.nvmrc" ]]; then
        cp "${MAIN_PROJECT_ROOT}/.nvmrc" "${WORKTREE_ROOT}/.nvmrc"
        print_success "Copied .nvmrc from main project"
    else
        echo "22.17.0" > "${WORKTREE_ROOT}/.nvmrc"
        print_success "Created .nvmrc with Node 22.17.0"
    fi
    
    # 8. Setup VS Code configuration
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
        ".pnpm": true
    },
    "typescript.preferences.includePackageJsonAutoImports": "auto",
    "npm.packageManager": "pnpm"
}
VSCODE
    
    if [[ -f "${MAIN_PROJECT_ROOT}/.vscode/extensions.json" ]]; then
        cp "${MAIN_PROJECT_ROOT}/.vscode/extensions.json" "${WORKTREE_ROOT}/.vscode/"
        print_success "Copied VS Code extensions recommendations"
    fi
    
    # 9. Create comprehensive .gitignore for worktree
    print_info "Creating worktree-specific .gitignore..."
    {
        echo "# Auto-generated by setup-worktree-pnpm.sh"
        echo ""
        echo "# pnpm files (NOT symlinked, each worktree has its own)"
        echo "node_modules/"
        echo ".pnpm/"
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
        echo "# Test caches"
        echo ".jest-cache/"
        echo ".vitest/"
        echo ""
        echo "# Logs"
        echo "*.log"
        echo "logs/"
        echo "pnpm-debug.log*"
    } > "${WORKTREE_ROOT}/.gitignore"
    
    print_success "Created comprehensive .gitignore"
    
    # 10. Show disk space savings
    print_info "Disk space analysis:"
    if [[ -d "$PNPM_STORE_DIR" ]]; then
        local store_size=$(du -sh "$PNPM_STORE_DIR" 2>/dev/null | cut -f1)
        print_info "Global pnpm store size: $store_size (shared across all projects)"
    fi
    
    if [[ -d "${WORKTREE_ROOT}/node_modules" ]]; then
        local modules_size=$(du -sh "${WORKTREE_ROOT}/node_modules" 2>/dev/null | cut -f1)
        print_info "Worktree node_modules size: $modules_size (hard links to store)"
    fi
    
    print_success "Worktree setup completed successfully!"
    echo
    print_info "Key differences with pnpm:"
    echo "  • node_modules is NOT symlinked (each worktree has its own)"
    echo "  • All packages use hard links to global store at: $PNPM_STORE_DIR"
    echo "  • Significant disk space savings through deduplication"
    echo "  • Faster installs after first download"
    echo
    print_info "Next steps:"
    echo "  1. cd ${WORKTREE_ROOT}"
    echo "  2. nvm use (switch to correct Node version)"
    echo "  3. code . (open in VS Code)"
    echo "  4. pnpm test (verify everything works)"
    echo
    print_success "The worktree is ready for development with pnpm!"
}

# Execute main function
main "$@"