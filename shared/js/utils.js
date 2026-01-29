function copyToClipboard(elementId, button) {
  const valueToCopy = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(valueToCopy).then(() => {
    button.classList.add('copied');
    setTimeout(() => {
      button.classList.remove('copied');
    }, 1500);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}
