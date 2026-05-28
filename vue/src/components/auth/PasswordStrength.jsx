import { getPasswordStrength } from '../../services/signupFlow';
import '../../assets/styles/components/auth/PasswordStrength.css';

const LABELS = ['', 'Faible', 'Correct', 'Fort'];
const MODS   = ['', 'weak',   'fair',    'strong'];

const PasswordStrength = ({ password }) => {
    const strength = getPasswordStrength(password);

    if (!password) return null;

    return (
        <div className="passwordStrength-root" aria-live="polite">
            <div className="passwordStrength-bars">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`passwordStrength-bar${i <= strength ? ` passwordStrength-bar--${MODS[strength]}` : ''}`}
                    />
                ))}
            </div>
            <span className={`passwordStrength-label passwordStrength-label--${MODS[strength]}`}>
                {LABELS[strength]}
            </span>
        </div>
    );
};

export default PasswordStrength;
