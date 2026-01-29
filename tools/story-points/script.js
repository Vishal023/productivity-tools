function enforceInteger(input) {
  input.value = input.value.replace(/[^0-9]/g, '');
}

function calculateEffort(clearPresets) {
  const daysInput = document.getElementById('daysSpent');
  const hoursInput = document.getElementById('hoursSpent');
  const minutesInput = document.getElementById('minutesSpent');

  enforceInteger(daysInput);
  enforceInteger(hoursInput);
  enforceInteger(minutesInput);

  const daysSpent = parseInt(daysInput.value) || 0;
  const hoursSpent = parseInt(hoursInput.value) || 0;
  const minutesSpent = parseInt(minutesInput.value) || 0;

  const spDayBased = daysSpent;
  const spHourBased = (1/8) * hoursSpent;
  const spMinuteBased = (1/480) * minutesSpent;
  const spCombined = spDayBased + spHourBased + spMinuteBased;

  document.getElementById('spCombined').textContent = spCombined.toFixed(4);

  if (clearPresets) {
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  }
}

function clearAll() {
  document.getElementById('daysSpent').value = '';
  document.getElementById('hoursSpent').value = '';
  document.getElementById('minutesSpent').value = '';
  document.getElementById('spCombined').textContent = '0.0000';
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
}

function applyPreset(days, hours, minutes) {
  document.getElementById('daysSpent').value = days || '';
  document.getElementById('hoursSpent').value = hours || '';
  document.getElementById('minutesSpent').value = minutes || '';
  calculateEffort();
  
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}
