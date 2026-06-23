# Speaks a friendly completion line when Claude finishes a response.
try {
  Add-Type -AssemblyName System.Speech
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try { $s.SelectVoice('Microsoft Zira Desktop') } catch {}
  $s.Rate = 2
  $s.Volume = 100
  $s.Speak('All done. What next?')
} catch {
  try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
}
