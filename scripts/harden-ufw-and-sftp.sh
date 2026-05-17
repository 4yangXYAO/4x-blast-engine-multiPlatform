#!/bin/bash

################################################################################
# VPS Hardening Script with UFW and Jailed SFTP Environment
# 
# Description: Automates the hardening of Ubuntu 22.04/24.04 VPS by:
#   1. Configuring UFW firewall
#   2. Setting up a chrooted SFTP environment for a specified user
#   3. Configuring proper permissions and ownerships
#
# Usage: sudo ./harden-ufw-and-sftp.sh <username> [ssh_port]
#   - username: The user account to set up for SFTP jailing (will be created if not exists)
#   - ssh_port: SSH port to allow (default: 22)
#
# Example: sudo ./harden-ufw-and-sftp.sh sftpuser 2222
#
# Author: Joki Blast Engine
# License: MIT
################################################################################

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/harden-ufw-and-sftp.log"
readonly SFTP_CHROOT_DIR="/var/sftp"
readonly SFTP_HOME_DIR="${SFTP_CHROOT_DIR}/homes"

# Logging function
log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Print colored output
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
    print_success "Running as root"
    log "INFO" "Script started by root"
}

# Verify Ubuntu version
check_ubuntu_version() {
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot determine OS. /etc/os-release not found"
        exit 1
    fi

    source /etc/os-release
    
    case "$VERSION_ID" in
        22.04)
            print_success "Ubuntu 22.04 LTS detected"
            log "INFO" "Ubuntu version: 22.04 LTS"
            ;;
        24.04)
            print_success "Ubuntu 24.04 LTS detected"
            log "INFO" "Ubuntu version: 24.04 LTS"
            ;;
        *)
            print_error "Unsupported Ubuntu version: $VERSION_ID (requires 22.04 or 24.04)"
            exit 1
            ;;
    esac
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    apt-get update -qq
    apt-get upgrade -y -qq
    print_success "System packages updated"
    log "INFO" "System packages updated"
}

# Install required packages
install_dependencies() {
    print_status "Installing required packages..."
    
    local packages=("ufw" "openssh-server" "openssh-sftp-server" "curl" "wget" "nano")
    
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $package"; then
            apt-get install -y -qq "$package"
            log "INFO" "Installed: $package"
        fi
    done
    
    print_success "All dependencies installed"
}

# Configure UFW firewall
configure_ufw() {
    local ssh_port="${1:-22}"
    
    print_status "Configuring UFW firewall..."
    log "INFO" "Configuring UFW with SSH port: $ssh_port"
    
    # Enable UFW with non-interactive mode
    ufw --force enable > /dev/null 2>&1
    log "INFO" "UFW enabled"
    
    # Set default policies
    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw default allow routed > /dev/null 2>&1
    log "INFO" "Default policies set: deny incoming, allow outgoing"
    
    # Allow SSH
    ufw allow "$ssh_port"/tcp > /dev/null 2>&1
    log "INFO" "SSH port $ssh_port allowed"
    
    # Allow established and related connections
    ufw allow in on eth0 to any port 1:65535 proto tcp from any stateful > /dev/null 2>&1 || true
    
    # Reload UFW to apply rules
    ufw reload > /dev/null 2>&1
    
    print_success "UFW firewall configured"
    echo -e "\n${BLUE}UFW Rules:${NC}"
    ufw status numbered
}

# Create SFTP chroot directory structure
create_chroot_structure() {
    local sftp_user="$1"
    
    print_status "Creating SFTP chroot directory structure..."
    log "INFO" "Creating chroot directories for user: $sftp_user"
    
    # Create main chroot directories
    mkdir -p "${SFTP_CHROOT_DIR}"
    mkdir -p "${SFTP_HOME_DIR}"
    
    # Create user's home directory within chroot
    local user_home="${SFTP_HOME_DIR}/${sftp_user}"
    mkdir -p "${user_home}"
    
    # Create upload directory
    local upload_dir="${user_home}/uploads"
    mkdir -p "${upload_dir}"
    
    # Create download directory
    local download_dir="${user_home}/downloads"
    mkdir -p "${download_dir}"
    
    print_success "Chroot directory structure created"
    log "INFO" "Chroot directories created at: ${SFTP_CHROOT_DIR}"
}

# Set correct permissions on chroot directories
set_chroot_permissions() {
    local sftp_user="$1"
    
    print_status "Setting correct permissions on chroot directories..."
    log "INFO" "Setting chroot permissions for user: $sftp_user"
    
    # Set permissions on main chroot dir (read-only for the user)
    chmod 755 "${SFTP_CHROOT_DIR}"
    chown root:root "${SFTP_CHROOT_DIR}"
    
    # Set permissions on homes directory
    chmod 755 "${SFTP_HOME_DIR}"
    chown root:root "${SFTP_HOME_DIR}"
    
    # Set permissions on user's home directory (read-only for security)
    local user_home="${SFTP_HOME_DIR}/${sftp_user}"
    chmod 755 "${user_home}"
    chown root:root "${user_home}"
    
    # Set permissions on upload directory (user can read/write)
    local upload_dir="${user_home}/uploads"
    chmod 755 "${upload_dir}"
    chown "${sftp_user}:${sftp_user}" "${upload_dir}"
    
    # Set permissions on download directory (user can read/write)
    local download_dir="${user_home}/downloads"
    chmod 755 "${download_dir}"
    chown "${sftp_user}:${sftp_user}" "${download_dir}"
    
    print_success "Chroot permissions set correctly"
    log "INFO" "Chroot permissions configured"
}

# Create or modify SFTP user
setup_sftp_user() {
    local sftp_user="$1"
    
    print_status "Setting up SFTP user: $sftp_user..."
    log "INFO" "Creating/modifying SFTP user: $sftp_user"
    
    # Check if user exists
    if ! id "$sftp_user" &>/dev/null; then
        # Create new user
        useradd -m -d "${SFTP_HOME_DIR}/${sftp_user}" \
                -s /usr/sbin/nologin \
                -c "SFTP User" \
                "$sftp_user"
        log "INFO" "Created new user: $sftp_user"
        print_success "User $sftp_user created"
        
        # Generate a strong random password
        local temp_password=$(openssl rand -base64 24)
        echo "${sftp_user}:${temp_password}" | chpasswd
        log "INFO" "Password set for user: $sftp_user"
        print_warning "Temporary password generated for $sftp_user (can be reset with: passwd $sftp_user)"
    else
        # Modify existing user
        usermod -d "${SFTP_HOME_DIR}/${sftp_user}" \
                -s /usr/sbin/nologin \
                "$sftp_user"
        log "INFO" "Modified existing user: $sftp_user"
        print_success "User $sftp_user modified"
    fi
}

# Configure SSH/SSHD for SFTP jailing
configure_sshd() {
    local sftp_user="$1"
    local user_home="${SFTP_HOME_DIR}/${sftp_user}"
    
    print_status "Configuring SSHD for jailed SFTP..."
    log "INFO" "Configuring SSHD for SFTP jailing"
    
    local sshd_config="/etc/ssh/sshd_config"
    
    # Backup original sshd_config if not already backed up
    if [[ ! -f "${sshd_config}.orig" ]]; then
        cp "${sshd_config}" "${sshd_config}.orig"
        log "INFO" "Backed up original sshd_config"
    fi
    
    # Check if SFTP subsystem is already configured
    if ! grep -q "^Subsystem sftp" "${sshd_config}"; then
        # Add SFTP subsystem configuration
        cat >> "${sshd_config}" << 'EOF'

# SFTP Subsystem Configuration
Subsystem sftp /usr/lib/openssh/sftp-server
EOF
        log "INFO" "SFTP subsystem added to sshd_config"
    fi
    
    # Add or update Match block for the specific user
    # First remove any existing Match block for this user (if present)
    sed -i "/^Match User ${sftp_user}$/,/^$/d" "${sshd_config}"
    
    # Add new Match block
    cat >> "${sshd_config}" << EOF

# SFTP Jail Configuration for user: $sftp_user
Match User ${sftp_user}
    ChrootDirectory ${user_home}
    AllowAgentForwarding no
    AllowTcpForwarding no
    PermitTTY no
    PermitTunnel no
    X11Forwarding no
    ForceCommand internal-sftp -d /
EOF
    
    log "INFO" "Added Match block for user: $sftp_user"
    
    # Validate sshd configuration
    if ! sshd -t 2>&1 | tee -a "${LOG_FILE}"; then
        print_error "SSHD configuration test failed! Rolling back..."
        log "ERROR" "SSHD configuration test failed"
        cp "${sshd_config}.orig" "${sshd_config}"
        return 1
    fi
    
    # Reload SSH service
    systemctl reload ssh
    log "INFO" "SSH service reloaded"
    
    print_success "SSHD configured for jailed SFTP"
}

# Verify SFTP jailing
verify_sftp_jailing() {
    local sftp_user="$1"
    
    print_status "Verifying SFTP jailing configuration..."
    log "INFO" "Verifying SFTP configuration for user: $sftp_user"
    
    # Check if user exists
    if ! id "$sftp_user" &>/dev/null; then
        print_error "User $sftp_user does not exist"
        return 1
    fi
    
    # Check chroot directories exist
    if [[ ! -d "${SFTP_HOME_DIR}/${sftp_user}" ]]; then
        print_error "User home directory does not exist"
        return 1
    fi
    
    # Check SSH configuration
    if ! grep -q "Match User ${sftp_user}" /etc/ssh/sshd_config; then
        print_error "SSH Match block not found for user"
        return 1
    fi
    
    print_success "SFTP jailing configuration verified"
    log "INFO" "SFTP configuration verified successfully"
}

# Display summary
display_summary() {
    local sftp_user="$1"
    local ssh_port="${2:-22}"
    
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          VPS Hardening Complete!                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}UFW Firewall Configuration:${NC}"
    echo "  • Status: Enabled"
    echo "  • SSH Port: $ssh_port/tcp allowed"
    echo "  • Default Policy: Deny incoming, Allow outgoing"
    echo ""
    
    echo -e "${GREEN}SFTP Jailing Configuration:${NC}"
    echo "  • SFTP User: $sftp_user"
    echo "  • Chroot Directory: ${SFTP_HOME_DIR}/${sftp_user}"
    echo "  • Upload Directory: ${SFTP_HOME_DIR}/${sftp_user}/uploads"
    echo "  • Download Directory: ${SFTP_HOME_DIR}/${sftp_user}/downloads"
    echo "  • Shell Access: Disabled (/usr/sbin/nologin)"
    echo "  • Port Forwarding: Disabled"
    echo "  • X11 Forwarding: Disabled"
    echo ""
    
    echo -e "${GREEN}Testing SFTP Connection:${NC}"
    echo "  • Command: sftp -P $ssh_port $sftp_user@localhost"
    echo "  • User will be restricted to: /${SFTP_HOME_DIR}/${sftp_user}"
    echo ""
    
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Set password for $sftp_user: passwd $sftp_user"
    echo "  2. Test SFTP connection from another machine"
    echo "  3. Review UFW rules: ufw status"
    echo "  4. Review logs: tail -f $LOG_FILE"
    echo ""
    
    log "INFO" "VPS hardening completed successfully"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 <username> [ssh_port]

Arguments:
  username    : The user account to set up for SFTP jailing (will be created if not exists)
  ssh_port    : SSH port to allow (optional, default: 22)

Examples:
  # Create SFTP user on default SSH port
  sudo $0 sftpuser

  # Create SFTP user on custom SSH port
  sudo $0 sftpuser 2222

EOF
    exit 1
}

# Main execution
main() {
    # Check arguments
    if [[ $# -lt 1 ]]; then
        usage
    fi
    
    local sftp_user="$1"
    local ssh_port="${2:-22}"
    
    # Validate username
    if ! [[ "$sftp_user" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        print_error "Invalid username. Only alphanumeric characters, hyphens, and underscores allowed"
        exit 1
    fi
    
    # Validate SSH port
    if ! [[ "$ssh_port" =~ ^[0-9]+$ ]] || [ "$ssh_port" -lt 1 ] || [ "$ssh_port" -gt 65535 ]; then
        print_error "Invalid SSH port. Must be between 1 and 65535"
        exit 1
    fi
    
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║    VPS Hardening Script with UFW and Jailed SFTP      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Initialize log file
    touch "${LOG_FILE}"
    chmod 644 "${LOG_FILE}"
    
    # Execute hardening steps
    check_root
    check_ubuntu_version
    update_system
    install_dependencies
    configure_ufw "$ssh_port"
    create_chroot_structure "$sftp_user"
    setup_sftp_user "$sftp_user"
    set_chroot_permissions "$sftp_user"
    configure_sshd "$sftp_user"
    verify_sftp_jailing "$sftp_user"
    display_summary "$sftp_user" "$ssh_port"
}

# Run main function
main "$@"
