function LoginPageAdmin() {
    return (
        <div>
            <h1>Admin Login</h1>
            <form>
                <input type="email" placeholder="Admin Email" />
                <input type="password" placeholder="Password" />
                <button type="submit">Login</button>
                <a href="/forgot-password">Forgot Password?</a>
            </form>
        </div>
    )
}

export default LoginPageAdmin;