import { useFocusMode } from "../contexts/FocusModeContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useDatabaseTheme } from "../contexts/DatabaseThemeManager";
import { getNavigationModeDisplayName } from "../services/NavigationModeNormalizationService";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  const { active: focusActive, variant, toggle } = useFocusMode();
  const { mode } = useNavigation();
  const { currentTheme } = useDatabaseTheme();

  return (
    <footer className={`footer-area ${className}`} data-navigation-mode={mode}>
      <div className="footer-content">
        {/* Footer Status Info */}
        <div className="footer-status">
          <span className="footer-status-item">
            Mode: {getNavigationModeDisplayName(mode)}
          </span>
          <span className="footer-status-item">
            Theme: {typeof currentTheme === 'string' ? currentTheme : 'Default'}
          </span>
          {focusActive && (
            <span className="footer-status-item footer-focus-indicator">
              Focus: {variant}
            </span>
          )}
        </div>

        {/* Footer Center - Focus Controls */}
        <div className="footer-focus-controls">
          <button
            className="footer-focus-btn"
            onClick={() => toggle()}
            title={focusActive ? "Focus Mode beenden" : "Focus Mode aktivieren"}
          >
            {focusActive ? "🎯 Focus An" : "⭕ Focus Aus"}
          </button>
          
          {focusActive && (
            <div className="footer-focus-variants">
              <span className="footer-focus-variant-label">Variant: {variant}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="footer-actions">
          <span className="footer-version">
            RawaLite v1.0.59
          </span>
        </div>
      </div>
    </footer>
  );
}