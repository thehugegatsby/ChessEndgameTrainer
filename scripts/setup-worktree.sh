#!/bin/bash
# Dynamic worktree setup script for EndgameTrainer project
# Usage: ./setup-worktree.sh <worktree-name>
# Example: ./setup-worktree.sh feature-xyz

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="EndgameTrainer"
MAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_VERSION="22.17.0"

# Function to print colored messages
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to setup a single worktree
setup_worktree() {
    local worktree_name="$1"
    local worktree_dir="$MAIN_DIR/../${PROJECT_NAME}-${worktree_name}"
    
    if [ ! -d "$worktree_dir" ]; then
        print_error "Worktree not found: $worktree_dir"
        return 1
    fi
    
    print_info "Setting up worktree: ${PROJECT_NAME}-${worktree_name}"
    cd "$worktree_dir"
    
    # 1. Symlink node_modules
    print_info "Creating node_modules symlink..."
    ln -sfn "../${PROJECT_NAME}/node_modules" node_modules
    
    # 2. Symlink build directories
    print_info "Creating build directory symlinks..."
    ln -sfn "../${PROJECT_NAME}/.next" .next 2>/dev/null || true
    ln -sfn "../${PROJECT_NAME}/dist" dist 2>/dev/null || true
    ln -sfn "../${PROJECT_NAME}/build" build 2>/dev/null || true
    
    # 3. Symlink TypeScript config
    print_info "Symlinking TypeScript config..."
    ln -sfn "../${PROJECT_NAME}/tsconfig.json" tsconfig.json
    [ -f "$MAIN_DIR/tsconfig.node.json" ] && ln -sfn "../${PROJECT_NAME}/tsconfig.node.json" tsconfig.node.json
    
    # 4. Symlink ESLint config
    print_info "Symlinking ESLint config..."
    ln -sfn "../${PROJECT_NAME}/.eslintrc.json" .eslintrc.json
    [ -f "$MAIN_DIR/.eslintignore" ] && ln -sfn "../${PROJECT_NAME}/.eslintignore" .eslintignore
    
    # 5. Symlink Prettier config
    print_info "Symlinking Prettier config..."
    [ -f "$MAIN_DIR/.prettierrc" ] && ln -sfn "../${PROJECT_NAME}/.prettierrc" .prettierrc
    [ -f "$MAIN_DIR/.prettierignore" ] && ln -sfn "../${PROJECT_NAME}/.prettierignore" .prettierignore
    
    # 6. Symlink other configs
    print_info "Symlinking other configs..."
    for config in next.config.js jest.config.js postcss.config.js tailwind.config.js vite.config.ts webpack.config.js; do
        [ -f "$MAIN_DIR/$config" ] && ln -sfn "../${PROJECT_NAME}/$config" "$config"
    done
    
    # 7. Symlink package files
    ln -sfn "../${PROJECT_NAME}/package.json" package.json
    ln -sfn "../${PROJECT_NAME}/package-lock.json" package-lock.json
    
    # 8. Symlink environment files
    print_info "Symlinking environment files..."
    [ -f "$MAIN_DIR/.env.local" ] && ln -sfn "../${PROJECT_NAME}/.env.local" .env.local
    [ -f "$MAIN_DIR/.env" ] && ln -sfn "../${PROJECT_NAME}/.env" .env
    
    # 9. Setup nvm
    print_info "Creating .nvmrc..."
    echo "$NODE_VERSION" > .nvmrc
    
    # 10. VS Code settings
    print_info "Setting up VS Code..."
    mkdir -p .vscode
    
    cat > .vscode/settings.json << 'VSCODE'
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
        "source.fixAll.eslint": true
    },
    "files.exclude": {
        "node_modules": false,
        ".next": true
    },
    "search.exclude": {
        "node_modules": true,
        ".next": true,
        "dist": true,
        "build": true
    }
}
VSCODE
    
    # Copy extensions recommendations if exists
    [ -f "$MAIN_DIR/.vscode/extensions.json" ] && cp -f "$MAIN_DIR/.vscode/extensions.json" .vscode/
    
    # 11. Create .gitignore
    print_info "Creating .gitignore..."
    cat > .gitignore << 'GITIGNORE'
# Symlinked files
node_modules
.next
dist
build
.env
.env.local
package.json
package-lock.json
tsconfig.json
.eslintrc.json
.prettierrc
*.config.js

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
GITIGNORE
    
    print_success "Worktree setup complete: ${worktree_name}"
    echo ""
}

# Function to test worktree setup
test_worktree() {
    local worktree_name="$1"
    local worktree_dir="$MAIN_DIR/../${PROJECT_NAME}-${worktree_name}"
    
    if [ ! -d "$worktree_dir" ]; then
        return 1
    fi
    
    cd "$worktree_dir"
    echo -n "  ${PROJECT_NAME}-${worktree_name}: "
    
    # Check TypeScript
    if [ -L "tsconfig.json" ] && [ -L "node_modules" ]; then
        echo -n "TypeScript ✅ "
    else
        echo -n "TypeScript ❌ "
    fi
    
    # Check ESLint
    if [ -L ".eslintrc.json" ] && [ -L "node_modules" ]; then
        echo -n "ESLint ✅ "
    else
        echo -n "ESLint ❌ "
    fi
    
    # Check Prettier
    if [ -L ".prettierrc" ] && [ -L "node_modules" ]; then
        echo "Prettier ✅"
    else
        echo "Prettier ❌"
    fi
}

# Function to list all worktrees
list_worktrees() {
    git worktree list --porcelain | grep "^worktree " | cut -d' ' -f2 | while read -r path; do
        if [ "$path" != "$MAIN_DIR" ]; then
            basename "$path" | sed "s/^${PROJECT_NAME}-//"
        fi
    done
}

# Main script
echo "🚀 ${PROJECT_NAME} Worktree Setup"
echo "================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

# Parse arguments
if [ "$1" == "--all" ] || [ "$1" == "-a" ]; then
    # Setup all worktrees
    print_info "Setting up all worktrees..."
    echo ""
    
    worktrees=($(list_worktrees))
    
    if [ ${#worktrees[@]} -eq 0 ]; then
        print_warning "No worktrees found!"
        exit 0
    fi
    
    for worktree in "${worktrees[@]}"; do
        setup_worktree "$worktree"
    done
    
elif [ "$1" == "--test" ] || [ "$1" == "-t" ]; then
    # Test all worktrees
    print_info "Testing worktree setups..."
    echo ""
    
    worktrees=($(list_worktrees))
    
    for worktree in "${worktrees[@]}"; do
        test_worktree "$worktree"
    done
    
elif [ "$1" == "--list" ] || [ "$1" == "-l" ]; then
    # List all worktrees
    print_info "Available worktrees:"
    list_worktrees | while read -r worktree; do
        echo "  • $worktree"
    done
    
elif [ "$1" == "--workspace" ] || [ "$1" == "-w" ]; then
    # Create VS Code workspace
    print_info "Creating VS Code multi-root workspace..."
    
    cat > "${PROJECT_NAME}.code-workspace" << EOF
{
    "folders": [
        {
            "path": ".",
            "name": "📦 Main"
        },
EOF
    
    list_worktrees | while read -r worktree; do
        cat >> "${PROJECT_NAME}.code-workspace" << EOF
        {
            "path": "../${PROJECT_NAME}-${worktree}",
            "name": "🔧 ${worktree}"
        },
EOF
    done
    
    # Remove last comma and close the JSON
    sed -i '$ s/,$//' "${PROJECT_NAME}.code-workspace"
    
    cat >> "${PROJECT_NAME}.code-workspace" << EOF
    ],
    "settings": {
        "typescript.tsdk": "${PROJECT_NAME}/node_modules/typescript/lib",
        "typescript.enablePromptUseWorkspaceTsdk": true,
        "eslint.workingDirectories": [
            { "directory": "${PROJECT_NAME}", "changeProcessCWD": true }
EOF
    
    list_worktrees | while read -r worktree; do
        cat >> "${PROJECT_NAME}.code-workspace" << EOF
,
            { "directory": "../${PROJECT_NAME}-${worktree}", "changeProcessCWD": true }
EOF
    done
    
    cat >> "${PROJECT_NAME}.code-workspace" << EOF
        ],
        "search.exclude": {
            "**/node_modules": true,
            "**/.next": true
        }
    }
}
EOF
    
    print_success "Workspace created: ${PROJECT_NAME}.code-workspace"
    
elif [ "$1" == "--help" ] || [ "$1" == "-h" ] || [ -z "$1" ]; then
    # Show help
    cat << EOF
Usage: ./setup-worktree.sh [OPTIONS] [WORKTREE_NAME]

Setup TypeScript, ESLint, and Prettier for ${PROJECT_NAME} worktrees.

OPTIONS:
    -a, --all        Setup all existing worktrees
    -t, --test       Test all worktree setups
    -l, --list       List all available worktrees
    -w, --workspace  Create VS Code multi-root workspace
    -h, --help       Show this help message

EXAMPLES:
    ./setup-worktree.sh feature-xyz     Setup specific worktree
    ./setup-worktree.sh --all           Setup all worktrees
    ./setup-worktree.sh --test          Test all setups
    ./setup-worktree.sh --workspace     Create VS Code workspace

WHAT IT DOES:
    • Symlinks node_modules from main repository
    • Symlinks all config files (TypeScript, ESLint, Prettier)
    • Creates VS Code settings for each worktree
    • Sets up .nvmrc for consistent Node version
    • Creates appropriate .gitignore

EOF
else
    # Setup specific worktree
    setup_worktree "$1"
    
    # Test the setup
    echo "🧪 Testing setup:"
    test_worktree "$1"
fi

cd "$MAIN_DIR"

# Final message
echo ""
print_success "Done! Next steps:"
echo "  1. cd ../${PROJECT_NAME}-<worktree-name>"
echo "  2. code . (or open in your editor)"
echo "  3. npm test (to verify everything works)"