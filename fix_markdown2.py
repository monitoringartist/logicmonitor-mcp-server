#!/usr/bin/env python3
"""
Script to fix remaining markdown formatting issues in tool descriptions.
"""

import re

def main():
    # Read the file
    with open('/home/jan/git/logicmonitor-mcp-server/src/api/tools.ts', 'r') as f:
        content = f.read()
    
    # Fix remaining bullet points with • character
    # Pattern: '• Text ' -> '\n- Text'
    content = re.sub(r"'•\s+([^']+?)\s+'", r"'\\n- \1'", content)
    
    # Also handle bullets at the start of continuation lines
    content = re.sub(r"(\s+)'•\s+", r"\1'\\n- ", content)
    
    # Fix filter examples that might have unescaped tildes
    # Pattern: filter:"text~*   but not already escaped \\~
    def escape_tildes(match):
        full = match.group(0)
        # Only escape if not already escaped
        if '\\~' not in full:
            return full.replace('~', '\\~')
        return full
    
    content = re.sub(r'filter:"[^"]*~[^"]*"', escape_tildes, content)
    
    # Fix reference to old tool names
    content = content.replace('"create_device_sdt"', '"create_resource_sdt"')
    content = content.replace('"list_device_datasources"', '"list_resource_datasources"')
    content = content.replace('"list_device_properties"', '"list_resource_properties"')
    content = content.replace('"update_device_property"', '"update_resource_property"')
    
    # Write back
    with open('/home/jan/git/logicmonitor-mcp-server/src/api/tools.ts', 'w') as f:
        f.write(content)
    
    print("Fixed remaining markdown formatting issues")

if __name__ == '__main__':
    main()

