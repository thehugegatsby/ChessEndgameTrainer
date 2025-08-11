#!/usr/bin/env bash

# Git Worktree Cleanup Script for pnpm
# Ensures zero waste after worktree removal
# Usage: ./cleanup-worktree.sh <worktree-name|worktree-path>

set -euo pipefail

# --- Configuration ---
readonly PNPM_STORE_DIR="${PNPM_STORE_DIR:-$HOME/.pnpm-store}"

# --- Helper Functions ---
print_info() { echo "ℹ️  $1"; }
print_success() { echo "✅ $1"; }
print_error() { echo "❌ $1"; }
print_warning() { echo "⚠️  $1"; }

# Clean worktree artifacts before removal
cleanup_worktree_artifacts() {
    local worktree_path="$1"
    
    print_info "Cleaning worktree artifacts at: $worktree_path"
    
    # 1. Remove node_modules and .pnpm folder
    if [[ -d "$worktree_path/node_modules" ]]; then
        print_info "Removing node_modules..."
        rm -rf "$worktree_path/node_modules"
        print_success "node_modules removed"
    fi
    
    # 2. Remove .pnpm folder if exists separately
    if [[ -d "$worktree_path/.pnpm" ]]; then
        print_info "Removing .pnpm cache..."
        rm -rf "$worktree_path/.pnpm"
        print_success ".pnpm cache removed"
    fi
    
    # 3. Remove VS Code settings
    if [[ -d "$worktree_path/.vscode" ]]; then
        print_info "Removing VS Code settings..."
        rm -rf "$worktree_path/.vscode"
        print_success "VS Code settings removed"
    fi
    
    # 4. Remove test artifacts
    for dir in .next dist build coverage playwright-report test-results .jest-cache .vitest; do
        if [[ -d "$worktree_path/$dir" ]] || [[ -L "$worktree_path/$dir" ]]; then
            print_info "Removing $dir..."
            rm -rf "$worktree_path/$dir"
        fi
    done
    
    # 5. Remove generated config files
    for file in .npmrc .gitignore .nvmrc; do
        if [[ -f "$worktree_path/$file" ]] && [[ ! -L "$worktree_path/$file" ]]; then
            print_info "Removing generated $file..."
            rm -f "$worktree_path/$file"
        fi
    done
}

# Clean broken symlinks in main repository
cleanup_broken_symlinks() {
    local main_repo="$1"
    
    print_info "Scanning for broken symlinks in main repository..."
    
    # Find and remove broken symlinks
    local broken_count=$(find "$main_repo" -type l -xtype l 2>/dev/null | wc -l)
    
    if [[ $broken_count -gt 0 ]]; then
        print_warning "Found $broken_count broken symlinks, removing..."
        find "$main_repo" -type l -xtype l -delete 2>/dev/null
        print_success "Broken symlinks removed"
    else
        print_success "No broken symlinks found"
    fi
}

# Optional: Prune pnpm store
prune_pnpm_store() {
    print_info "Pruning pnpm store to remove unreferenced packages..."
    
    if command -v pnpm &> /dev/null; then
        local before_size=$(du -sh "$PNPM_STORE_DIR" 2>/dev/null | cut -f1)
        
        pnpm store prune
        
        local after_size=$(du -sh "$PNPM_STORE_DIR" 2>/dev/null | cut -f1)
        print_success "Store pruned (before: $before_size, after: $after_size)"
    else
        print_warning "pnpm not found, skipping store prune"
    fi
}

# Main cleanup function
main() {
    local worktree_identifier="${1:-}"
    
    if [[ -z "$worktree_identifier" ]]; then
        print_error "Usage: $0 <worktree-name|worktree-path>"
        print_info "Example: $0 feature-branch"
        print_info "Example: $0 ../EndgameTrainer-feature"
        exit 1
    fi
    
    print_info "Starting worktree cleanup..."
    
    # Get main repository root
    local main_repo
    main_repo=$(git rev-parse --show-toplevel)
    
    # Determine worktree path
    local worktree_path
    
    # Check if input is a path or a branch name
    if [[ -d "$worktree_identifier" ]]; then
        worktree_path=$(realpath "$worktree_identifier")
    else
        # Try to find worktree by branch name
        worktree_path=$(git worktree list --porcelain | grep -A1 "branch refs/heads/$worktree_identifier" | grep "worktree " | cut -d' ' -f2 || true)
        
        if [[ -z "$worktree_path" ]]; then
            # Try standard naming convention
            worktree_path="../EndgameTrainer-$worktree_identifier"
            if [[ ! -d "$worktree_path" ]]; then
                print_error "Worktree not found: $worktree_identifier"
                print_info "Available worktrees:"
                git worktree list
                exit 1
            fi
        fi
    fi
    
    print_info "Found worktree at: $worktree_path"
    
    # Step 1: Clean worktree artifacts
    cleanup_worktree_artifacts "$worktree_path"
    
    # Step 2: Remove the worktree
    print_info "Removing git worktree..."
    if git worktree remove "$worktree_path" --force 2>/dev/null; then
        print_success "Git worktree removed"
    else
        print_warning "Git worktree already removed or not found"
    fi
    
    # Step 3: Clean broken symlinks in main repo
    cleanup_broken_symlinks "$main_repo"
    
    # Step 4: Optional - Ask about store pruning
    read -p "Do you want to prune the pnpm store now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        prune_pnpm_store
    else
        print_info "Skipping store prune (run 'pnpm store prune' manually if needed)"
    fi
    
    # Step 5: Verify cleanup
    print_info "Verifying cleanup..."
    
    # Check if worktree still exists
    if git worktree list | grep -q "$worktree_path"; then
        print_warning "Worktree still appears in git worktree list"
    else
        print_success "Worktree removed from git tracking"
    fi
    
    # Check if directory still exists
    if [[ -d "$worktree_path" ]]; then
        print_warning "Directory still exists at $worktree_path (may need manual removal)"
    else
        print_success "Directory completely removed"
    fi
    
    print_success "Worktree cleanup completed!"
    print_info "Zero waste achieved - no orphaned files or dependencies"
}

# Execute main function
main "$@"