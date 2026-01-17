"""
LIMS Launcher - Opens browser to server URL
Simple launcher application that can be distributed to client PCs
"""
import webbrowser
import configparser
import os
import sys

def main():
    # Get the directory where the launcher is located
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        app_dir = os.path.dirname(sys.executable)
    else:
        # Running as script
        app_dir = os.path.dirname(os.path.abspath(__file__))
    
    config_file = os.path.join(app_dir, 'launcher_config.ini')
    
    # Read configuration
    config = configparser.ConfigParser()
    
    if os.path.exists(config_file):
        config.read(config_file)
        server_url = config.get('Server', 'url', fallback='http://localhost:8000')
    else:
        # Create default config if not found
        server_url = 'http://localhost:8000'
        config['Server'] = {'url': server_url}
        
        with open(config_file, 'w') as f:
            config.write(f)
        
        print(f"Created default configuration file: {config_file}")
        print(f"Please edit the file to set your server URL.")
    
    # Open browser
    print(f"Opening LIMS at: {server_url}")
    webbrowser.open(server_url)
    
    print("Browser opened successfully!")
    print("You can close this window.")

if __name__ == '__main__':
    main()
