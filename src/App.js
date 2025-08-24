
import React, { useState } from 'react';
import NavigationBar from './components/NavigationBar';
import SettingsModal from './components/SettingsModal';

const App = () => {
  // Controls whether the settings modal is visible
  const [showSettings, setShowSettings] = useState(false);

  // Stores the actual settings
  const [settings, setSettings] = useState({
    suggestionArrows: true,
    threatArrows: true,
    moveFeedback: true,
  });

  // Toggles individual settings
  const handleSettingChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Called when user clicks Save
  const handleSaveSettings = () => {
    // You could save to localStorage here
    setShowSettings(false); // Close modal
  };

  return (
    <>
      <NavigationBar
        onStart={() => console.log('Start')}
        onHome={() => console.log('Home')}
        onSettings={() => setShowSettings(true)} // Show settings modal
        onResign={() => console.log('Resign')}
        onHint={() => console.log('Hint')}
        onUndo={() => console.log('Undo')}
      />

      {/* Conditionally show SettingsModal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingChange}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default App;
