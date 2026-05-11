with open('run_factory.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Clean up the end of the file
while lines and (lines[-1].strip() == 'start_factory()' or lines[-1].strip() == ''):
    lines.pop()

# Add proper main block
lines.append('\n')
lines.append('if __name__ == "__main__":\n')
lines.append('    start_factory()\n')

with open('run_factory.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)
