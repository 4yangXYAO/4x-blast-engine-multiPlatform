#!/bin/bash

################################################################################
# Test Suite for VPS Hardening Script
#
# This test suite validates the harden-ufw-and-sftp.sh script's core functions
# without requiring root access or an actual Ubuntu VPS.
#
# Usage: ./test-harden-ufw-and-sftp.sh
################################################################################

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test result tracking
declare -a FAILED_TESTS

# Print test result
test_result() {
    local test_name="$1"
    local status="$2"
    
    ((TESTS_RUN++))
    
    if [[ "$status" == "PASS" ]]; then
        ((TESTS_PASSED++))
        echo -e "${GREEN}[✓]${NC} $test_name"
    else
        ((TESTS_FAILED++))
        echo -e "${RED}[✗]${NC} $test_name"
        FAILED_TESTS+=("$test_name")
    fi
}

# Test 1: Script existence and permissions
test_script_exists() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if [[ -f "$script" ]] && [[ -x "$script" ]]; then
        test_result "Script exists and is executable" "PASS"
    else
        test_result "Script exists and is executable" "FAIL"
    fi
}

# Test 2: Bash syntax validation
test_bash_syntax() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if bash -n "$script" 2>/dev/null; then
        test_result "Bash syntax is valid" "PASS"
    else
        test_result "Bash syntax is valid" "FAIL"
    fi
}

# Test 3: Shebang line
test_shebang() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    local shebang=$(head -1 "$script")
    
    if [[ "$shebang" == "#!/bin/bash" ]]; then
        test_result "Shebang line is correct" "PASS"
    else
        test_result "Shebang line is correct" "FAIL"
    fi
}

# Test 4: Script has proper comments and documentation
test_script_documentation() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    local doc_lines=$(grep -c "^#" "$script" || true)
    
    # Check if script has reasonable documentation (>30 comment lines)
    # and check for the main documentation header
    if [[ $doc_lines -gt 30 ]] && grep -q "Description: Automates the hardening" "$script"; then
        test_result "Script has adequate documentation" "PASS"
    else
        test_result "Script has adequate documentation" "FAIL"
    fi
}

# Test 5: Check for required functions
test_required_functions() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    local required_functions=(
        "check_root"
        "check_ubuntu_version"
        "update_system"
        "install_dependencies"
        "configure_ufw"
        "create_chroot_structure"
        "setup_sftp_user"
        "set_chroot_permissions"
        "configure_sshd"
        "verify_sftp_jailing"
        "display_summary"
    )
    
    local all_found=true
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "$script"; then
            all_found=false
            break
        fi
    done
    
    if [[ "$all_found" == true ]]; then
        test_result "All required functions are defined" "PASS"
    else
        test_result "All required functions are defined" "FAIL"
    fi
}

# Test 6: Error handling with set -euo pipefail
test_error_handling() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "set -euo pipefail" "$script"; then
        test_result "Error handling flags are present" "PASS"
    else
        test_result "Error handling flags are present" "FAIL"
    fi
}

# Test 7: Logging functionality
test_logging_function() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "^log()" "$script"; then
        test_result "Logging function is defined" "PASS"
    else
        test_result "Logging function is defined" "FAIL"
    fi
}

# Test 8: Color output functions
test_color_functions() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    local color_funcs=(
        "print_status"
        "print_success"
        "print_error"
        "print_warning"
    )
    
    local all_found=true
    for func in "${color_funcs[@]}"; do
        if ! grep -q "^${func}()" "$script"; then
            all_found=false
            break
        fi
    done
    
    if [[ "$all_found" == true ]]; then
        test_result "Color output functions are defined" "PASS"
    else
        test_result "Color output functions are defined" "FAIL"
    fi
}

# Test 9: Configuration variables
test_configuration_variables() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "SFTP_CHROOT_DIR=" "$script" && \
       grep -q "SFTP_HOME_DIR=" "$script"; then
        test_result "Configuration variables are defined" "PASS"
    else
        test_result "Configuration variables are defined" "FAIL"
    fi
}

# Test 10: Documentation files exist
test_documentation_files() {
    local docs_dir="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts"
    
    local has_all=true
    if [[ ! -f "$docs_dir/SFTP_UFW_HARDENING.md" ]] || \
       [[ ! -f "$docs_dir/README-UFW-SFTP.md" ]] || \
       [[ ! -f "$docs_dir/INTEGRATION-GUIDE.md" ]]; then
        has_all=false
    fi
    
    if [[ "$has_all" == true ]]; then
        test_result "Documentation files exist" "PASS"
    else
        test_result "Documentation files exist" "FAIL"
    fi
}

# Test 11: Examples file exists and is valid
test_examples_file() {
    local examples="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/examples-harden-ufw-and-sftp.sh"
    
    if [[ -f "$examples" ]] && [[ -x "$examples" ]]; then
        if bash -n "$examples" 2>/dev/null; then
            test_result "Examples file is valid" "PASS"
        else
            test_result "Examples file is valid" "FAIL"
        fi
    else
        test_result "Examples file is valid" "FAIL"
    fi
}

# Test 12: Script handles arguments
test_argument_handling() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "if \[\[ \$# -lt 1 \]\]" "$script"; then
        test_result "Script validates required arguments" "PASS"
    else
        test_result "Script validates required arguments" "FAIL"
    fi
}

# Test 13: Usage information
test_usage_information() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "^usage()" "$script"; then
        test_result "Usage information function exists" "PASS"
    else
        test_result "Usage information function exists" "FAIL"
    fi
}

# Test 14: Main function exists
test_main_function() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "^main()" "$script"; then
        test_result "Main function is defined" "PASS"
    else
        test_result "Main function is defined" "FAIL"
    fi
}

# Test 15: Script calls main function
test_main_execution() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "^main \"\$@\"" "$script"; then
        test_result "Main function is called" "PASS"
    else
        test_result "Main function is called" "FAIL"
    fi
}

# Test 16: UFW configuration present
test_ufw_configuration() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "configure_ufw" "$script" && \
       grep -q "ufw.*enable" "$script" && \
       grep -q "ufw default" "$script"; then
        test_result "UFW configuration is implemented" "PASS"
    else
        test_result "UFW configuration is implemented" "FAIL"
    fi
}

# Test 17: SFTP jailing implementation
test_sftp_jailing() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "ChrootDirectory" "$script" && \
       grep -q "ForceCommand internal-sftp" "$script"; then
        test_result "SFTP jailing is implemented" "PASS"
    else
        test_result "SFTP jailing is implemented" "FAIL"
    fi
}

# Test 18: Permission configuration
test_permission_configuration() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q "chown root:root" "$script" && \
       grep -q "chmod 755" "$script"; then
        test_result "Permission configuration is implemented" "PASS"
    else
        test_result "Permission configuration is implemented" "FAIL"
    fi
}

# Test 19: SSH configuration backup
test_ssh_backup() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    
    if grep -q ".orig" "$script"; then
        test_result "SSH config backup is implemented" "PASS"
    else
        test_result "SSH config backup is implemented" "FAIL"
    fi
}

# Test 20: Script completeness check
test_script_size() {
    local script="/home/runner/work/joki-blast-engine/joki-blast-engine/scripts/harden-ufw-and-sftp.sh"
    local size=$(wc -l < "$script")
    
    if [[ $size -gt 400 ]]; then
        test_result "Script has sufficient implementation (> 400 lines)" "PASS"
    else
        test_result "Script has sufficient implementation (> 400 lines)" "FAIL"
    fi
}

# Print test summary
print_summary() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Test Suite Summary                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Total Tests Run:    ${TESTS_RUN}"
    echo -e "${GREEN}Tests Passed:       ${TESTS_PASSED}${NC}"
    echo -e "${RED}Tests Failed:       ${TESTS_FAILED}${NC}"
    echo ""
    
    if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  • $test"
        done
        echo ""
    fi
    
    local pass_percentage=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo -e "Pass Rate: ${GREEN}${pass_percentage}%${NC}"
    echo ""
}

# Main test execution
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  VPS Hardening Script - Test Suite             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Run all tests
    echo -e "${YELLOW}Running tests...${NC}\n"
    
    test_script_exists
    test_bash_syntax
    test_shebang
    test_script_documentation
    test_required_functions
    test_error_handling
    test_logging_function
    test_color_functions
    test_configuration_variables
    test_documentation_files
    test_examples_file
    test_argument_handling
    test_usage_information
    test_main_function
    test_main_execution
    test_ufw_configuration
    test_sftp_jailing
    test_permission_configuration
    test_ssh_backup
    test_script_size
    
    # Print summary
    print_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
