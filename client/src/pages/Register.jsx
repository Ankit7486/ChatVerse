import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);

        try {

            const response = await api.post("/register", {
                name,
                email,
                password,
            });

            navigate("/");

        } catch (error) {

            console.log(error);
        }
        finally {
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-center">

            <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-8">

                <h1 className="text-4xl font-bold text-center text-blue-700">

                    ChatVerse

                </h1>

                <p className="text-center text-gray-500 mt-2">

                    Create Your Account

                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                >
                    
                    <input
 
                        disabled={loading}

                        type="text"

                        placeholder="Name"

                        value={name}

                        onChange={(e)=>setName(e.target.value)}

                        className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

                    />

                    <input
  
                        disabled={loading}

                        type="email"

                        placeholder="Email"

                        value={email}

                        onChange={(e)=>setEmail(e.target.value)}

                        className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

                    />

                    <input

                        disabled={loading}

                        type="password"

                        placeholder="Password"

                        value={password}

                        onChange={(e)=>setPassword(e.target.value)}

                        className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-white font-semibold transition
                          ${
                             loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                          }`}
               >

                 {

                    loading

                       ?

                         "Creating Account..."

                         :

                         "Register"

                }

                   </button>

                </form>

                <p className="text-center mt-6 text-gray-600">

                    Already have an account?

                    <Link

                        to="/"

                        className="text-blue-600 font-semibold ml-1"

                    >

                        Login

                    </Link>

                </p>

            </div>

        </div>

    );
}

export default Register;