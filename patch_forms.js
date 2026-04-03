const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'src', 'components', 'forms');
const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.tsx'));

let patchedCount = 0;

for (const file of files) {
  const filePath = path.join(formsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if form uses isPending and has a handleSubmit
  if (content.includes('isPending') && content.includes('const handleSubmit = (e: React.FormEvent')) {
    // Check if it's already patched
    if (!content.includes('if (isPending) return;')) {
      // Find the handleSubmit line
      const handleRegex = /const handleSubmit = \(e: React\.FormEvent<HTMLFormElement>\) => \{\s*e\.preventDefault\(\);\s*(setError\(null\);)?/g;
      
      content = content.replace(handleRegex, match => {
        return match + '\n    if (isPending) return;\n';
      });

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Patched ${file}`);
      patchedCount++;
    }
  }
}

console.log(`Total patched: ${patchedCount} files.`);
