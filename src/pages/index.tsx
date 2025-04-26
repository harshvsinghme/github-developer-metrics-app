import { useState } from "react";
import { authenticate } from "@/lib/auth";
import { useRouter } from "next/router";
import { useUserStore } from "@/store/useUserStore";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("alice123");
  const setUserEmail = useUserStore((state) => state.setEmail);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticate(email, password)) {
      setUserEmail(email);
      router.push("/dashboard");
    } else {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Invalid credentials!",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-6 text-center">GitHub Metrics Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
}
