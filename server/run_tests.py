#!/usr/bin/env python3
"""
Simple test runner for the Prompt Engineering Test Harness API.
"""

import subprocess
import sys
import os

def run_tests():
    """Run the test suite."""
    print("🧪 Running Prompt Engineering Test Harness API Tests...")
    print("=" * 60)
    
    # Change to the server directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run pytest
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "-v", 
            "--tb=short",
            "--disable-warnings"
        ], capture_output=False)
        
        if result.returncode == 0:
            print("\n✅ All tests passed!")
        else:
            print(f"\n❌ Tests failed with exit code {result.returncode}")
            sys.exit(result.returncode)
            
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
