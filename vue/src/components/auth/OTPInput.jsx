import { useEffect, useRef } from 'react';
import '../../assets/styles/components/auth/OTPInput.css';

const OTP_LENGTH = 6;

const OTPInput = ({ value = '', onChange, error = false, disabled = false }) => {
    const inputsRef = useRef([]);
    const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    const handleChange = (index, e) => {
        const char = e.target.value.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        onChange(newDigits.join(''));
        if (char && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (digits[index]) {
                const newDigits = [...digits];
                newDigits[index] = '';
                onChange(newDigits.join(''));
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
        }
        if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        onChange(pasted.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH));
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputsRef.current[focusIndex]?.focus();
    };

    return (
        <div className={`otpInput-root${error ? ' otpInput-root--error' : ''}`} role="group" aria-label="Code de vérification à 6 chiffres">
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={el => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={`otpInput-cell${digit ? ' otpInput-cell--filled' : ''}${error ? ' otpInput-cell--error' : ''}`}
                    disabled={disabled}
                    aria-label={`Chiffre ${i + 1}`}
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );
};

export default OTPInput;
