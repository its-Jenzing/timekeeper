#!/bin/bash

echo "====================================================="
echo "GIT REPOSITORY SETUP FOR TRUENAS JAIL"
echo "====================================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Installing git..."
    # For FreeBSD-based jails (TrueNAS Core typically uses FreeBSD)
    if command -v pkg &> /dev/null; then
        pkg install -y git
    # For Debian/Ubuntu-based jails
    elif command -v apt &> /dev/null; then
        apt update
        apt install -y git
    else
        echo "ERROR: Could not determine package manager. Please install git manually."
        exit 1
    fi
fi

echo ""
echo "Git is installed and ready to use."
echo ""
echo "To clone your repository into the jail, use one of these methods:"
echo ""
echo "METHOD 1: Clone directly from GitHub/GitLab/etc:"
echo "----------------------------------------------"
echo "git clone https://github.com/yourusername/your-repo-name.git"
echo "cd your-repo-name"
echo ""
echo "METHOD 2: Clone from a local repository (if you have SSH access):"
echo "--------------------------------------------------------------"
echo "# From your local machine:"
echo "scp -r /path/to/your/local/repo username@truenas-ip:/path/in/jail/"
echo ""
echo "# Or use git on your local machine:"
echo "cd /path/to/your/local/repo"
echo "git remote add jail username@truenas-ip:/path/in/jail/repo-name.git"
echo "git push jail main"
echo ""
echo "METHOD 3: Initialize a new repository in the jail:"
echo "----------------------------------------------"
echo "mkdir your-repo-name"
echo "cd your-repo-name"
echo "git init"
echo "# Then add your files and commit"
echo ""
echo "After cloning/setting up your repository:"
echo "--------------------------------------"
echo "1. Navigate to your repository directory"
echo "2. Run the deployment script:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
echo "====================================================="
