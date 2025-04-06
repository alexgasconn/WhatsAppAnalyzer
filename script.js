function handleFile() {
    const input = document.getElementById("fileInput");
    const file = input.files[0];
  
    if (!file) {
      alert("Please select a .txt file");
      return;
    }
  
    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      const output = document.getElementById("output");
      output.textContent = content.substring(0, 1000) + "\n\n...File loaded!";
      // Later: Send to backend or process in JS
    };
  
    reader.readAsText(file);
  }
  