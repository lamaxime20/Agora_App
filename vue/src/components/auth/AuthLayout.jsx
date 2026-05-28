import AuthBranding from './AuthBranding';
import '../../assets/styles/components/auth/AuthLayout.css';

const AuthLayout = ({ children, brandingVariant = 'default' }) => {
    return (
        <div className="authLayout-root">
            <aside className="authLayout-branding" aria-hidden="true">
                <AuthBranding variant={brandingVariant} />
            </aside>

            <div className="authLayout-form">
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
