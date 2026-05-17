#!/bin/bash
################################################################################
# SFTP Jailed User Setup Script
# Configures a chrooted SFTP user for secure file uploads compatible with
# Ubuntu 22.04 LTS and Ubuntu 24.04 LTS
#
# Usage: sudo ./setup-sftp-jailed-user.sh <username> <jail_base_path>
#        Example: sudo ./setup-sftp-jailed-user.sh sftp_user /data/sftp
#
# Features:
#  - Creates a jailed SFTP user with chroot restrictions
#  - Configures SSH for SFTP-only access
#  - Sets up proper permissions for cross-user file access
#  - Compatible with Ubuntu 22.04 and 24.04
#  - Supports ACL-based permissions for flexible access control
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Validate arguments
validate_arguments() {
    if [[ $# -lt 2 ]]; then
        log_error "Insufficient arguments"
        echo "Usage: sudo $SCRIPT_NAME <username> <jail_base_path>"
        echo ""
        echo "Arguments:"
        echo "  <username>          - Name of the jailed SFTP user to create"
        echo "  <jail_base_path>    - Base path for the jail (e.g., /data/sftp)"
        echo ""
        echo "Example:"
        echo "  sudo $SCRIPT_NAME sftp_user /data/sftp"
        exit 1
    fi

    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Check system compatibility
check_system_compatibility() {
    log_info "Checking system compatibility..."

    if ! command -v sshd &> /dev/null; then
        log_error "SSH server (sshd) is not installed"
        exit 1
    fi

    # Check Ubuntu version
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" != "ubuntu" ]]; then
            log_warn "This script is designed for Ubuntu. Other distributions may require adjustments."
        fi

        if [[ ! "$VERSION_ID" =~ ^(22\.04|24\.04)$ ]]; then
            log_warn "This script has been tested on Ubuntu 22.04 and 24.04. Your version is $VERSION_ID. Compatibility not guaranteed."
        fi

        log_info "Detected: $PRETTY_NAME"
    else
        log_warn "Could not detect OS version. Please ensure you're running Ubuntu 22.04 or 24.04."
    fi

    log_success "System compatibility check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."

    # Update package lists
    if ! apt-get update -q 2>/dev/null; then
        log_warn "apt-get update had warnings or minor issues, continuing..."
    fi

    # Check if openssh-server is installed using dpkg-query for reliability
    if ! dpkg-query -W -f='${Status}' openssh-server 2>/dev/null | grep -q 'install ok installed'; then
        log_info "Installing openssh-server..."
        apt-get install -y openssh-server openssh-sftp-server
    fi

    # Install ACL utilities for flexible permission management
    if ! command -v setfacl &> /dev/null; then
        log_info "Installing ACL utilities..."
        apt-get install -y acl
    fi

    log_success "Dependencies installed"
}

# Create jailed user
create_jailed_user() {
    local username=$1
    local jail_path=$2

    log_info "Creating jailed SFTP user: $username"

    # Check if user already exists
    if id "$username" &>/dev/null; then
        log_warn "User $username already exists. Skipping user creation."
        return
    fi

    # Create user with no login shell and home directory in jail
    useradd \
        --no-create-home \
        --shell /usr/sbin/nologin \
        --home-dir "$jail_path" \
        "$username" || {
        log_error "Failed to create user $username"
        exit 1
    }

    log_success "User created: $username"
}

# Setup jail directory structure
setup_jail_directory() {
    local username=$1
    local jail_path=$2
    local upload_dir="${jail_path}/uploads"

    log_info "Setting up jail directory structure at: $jail_path"

    # Create jail base directory
    if [[ ! -d "$jail_path" ]]; then
        mkdir -p "$jail_path"
    fi

    # Jail base must be owned by root with restricted permissions
    chown root:root "$jail_path"
    chmod 755 "$jail_path"

    # Create uploads subdirectory where user can write
    if [[ ! -d "$upload_dir" ]]; then
        mkdir -p "$upload_dir"
    fi

    # Set ownership and permissions for uploads directory
    # Owner: root (required for jail security), but user can write
    chown root:"$username" "$upload_dir"
    chmod 775 "$upload_dir"

    # Add sticky bit to prevent users from deleting each other's files
    chmod +t "$upload_dir"

    log_success "Jail directory structure created"
    log_info "  Jail root: $jail_path"
    log_info "  Upload dir: $upload_dir"
}

# Configure SSH for chroot jail
configure_ssh_chroot() {
    local username=$1
    local jail_path=$2
    local sshd_config="/etc/ssh/sshd_config"
    local sshd_config_d="/etc/ssh/sshd_config.d"
    local jail_config="${sshd_config_d}/99-sftp-jail-${username}.conf"

    log_info "Configuring SSH for chroot jail..."

    # Create sshd_config.d directory if it doesn't exist (Ubuntu 22.04+)
    if [[ ! -d "$sshd_config_d" ]]; then
        mkdir -p "$sshd_config_d"
    fi

    # Check if configuration already exists
    if [[ -f "$jail_config" ]]; then
        log_warn "SSH jail configuration already exists for $username"
        return
    fi

    # Create match block for the jailed user
    cat > "$jail_config" << EOF
# SFTP jail configuration for user: $username
# Generated by $SCRIPT_NAME on $(date)

Match User $username
    ChrootDirectory $jail_path
    AllowTcpForwarding no
    AllowAgentForwarding no
    AllowStreamLocalForwarding no
    PermitTTY no
    PermitUserEnvironment no
    X11Forwarding no
    ForceCommand internal-sftp -l INFO
    # Increase verbosity for debugging (comment out in production)
    # LogLevel VERBOSE

EOF

    log_success "SSH chroot configuration created: $jail_config"

    # Verify sshd configuration syntax
    log_info "Validating SSH configuration..."
    if sshd -t &>/dev/null; then
        log_success "SSH configuration is valid"
    else
        log_error "SSH configuration validation failed"
        cat "$jail_config"
        exit 1
    fi

    # Reload SSH service
    log_info "Reloading SSH service..."
    if systemctl is-active --quiet ssh; then
        systemctl reload ssh
        log_success "SSH service reloaded"
    else
        log_warn "SSH service is not running. Please run: systemctl start ssh"
    fi
}

# Setup permissions for cross-user access
setup_cross_user_permissions() {
    local upload_dir=$1
    local username=$2

    log_info "Setting up cross-user file access permissions..."

    # Ensure directory exists before checking mount point
    if [[ ! -d "$upload_dir" ]]; then
        log_warn "Upload directory does not exist yet, skipping ACL check"
        return
    fi

    # Ensure ACL support is enabled on the filesystem (more specific check)
    local mount_point=$(df -P "$upload_dir" | tail -1 | awk '{print $NF}')
    # Use more specific pattern to avoid false positives
    if ! mount | grep "^[^ ]* on $(printf '%s\n' "$mount_point" | sed 's/[[\.*^$/]/\\&/g') " | grep -q "acl"; then
        log_warn "ACL may not be enabled on $mount_point"
        log_info "To enable ACL, add 'acl' option to mount point in /etc/fstab"
    fi

    # Set default ACL for new files (readable by all users)
    if command -v setfacl &> /dev/null; then
        # Default ACL for user ($username can create files)
        setfacl -d -m u::rwx "$upload_dir"
        setfacl -d -m g::rx "$upload_dir"
        setfacl -d -m o::rx "$upload_dir"

        # Set ACL for existing directory
        setfacl -m u::rwx "$upload_dir"
        setfacl -m g::rx "$upload_dir"
        setfacl -m o::rx "$upload_dir"

        log_success "ACL permissions configured"
        log_info "Files uploaded by $username will be readable by other users"
    else
        log_warn "setfacl not available. Using standard permissions only."
        log_info "Ensure group permissions on $upload_dir allow cross-user access"
    fi
}

# Display summary
display_summary() {
    local username=$1
    local jail_path=$2
    local upload_dir="${jail_path}/uploads"

    echo ""
    echo "=========================================="
    echo -e "${GREEN}SFTP Jail Setup Complete${NC}"
    echo "=========================================="
    echo ""
    echo "User Configuration:"
    echo "  Username:          $username"
    echo "  Shell:             /usr/sbin/nologin (SFTP only)"
    echo "  Jail Root:         $jail_path"
    echo "  Upload Directory:  $upload_dir"
    echo ""
    echo "Access Information:"
    echo "  Connection:        sftp://$username@<server-ip>"
    echo "  SFTP Command:      sftp $username@<server-ip>"
    echo ""
    echo "Permissions:"
    echo "  Jail root owner:   root (required for security)"
    echo "  Upload dir owner:  root:$username"
    echo "  Upload dir mode:   775 (rwx for owner/group, rx for others)"
    echo ""
    echo "Managing Access:"
    echo "  Add user to group: usermod -aG $username <other_username>"
    echo "  Set default ACL:   setfacl -d -m u::<user>:rx $upload_dir"
    echo "  Check permissions: getfacl $upload_dir"
    echo ""
    echo "Troubleshooting:"
    echo "  View SSH logs:     journalctl -u ssh -f"
    echo "  Test connection:   sftp -v $username@localhost"
    echo "  Check user config: grep -A5 'Match User $username' /etc/ssh/sshd_config.d/99-sftp-jail-$username.conf"
    echo ""
    echo "=========================================="
    echo ""
}

# Main execution
main() {
    validate_arguments "$@"

    local username="$1"
    local jail_path="$2"

    log_info "Starting SFTP jailed user setup..."
    log_info "Username: $username"
    log_info "Jail path: $jail_path"
    echo ""

    check_system_compatibility
    install_dependencies
    create_jailed_user "$username" "$jail_path"
    setup_jail_directory "$username" "$jail_path"
    configure_ssh_chroot "$username" "$jail_path"
    setup_cross_user_permissions "${jail_path}/uploads" "$username"

    display_summary "$username" "$jail_path"

    log_success "Setup completed successfully!"
}

# Run main function with all arguments
main "$@"
