"use client";
import { useUser } from "@/context/context";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "./ToastProvider";
const Navbar = () => {
  const router = useRouter();
  const { data, setData } = useUser();

  // Helper function to get Authorization headers
  const getAuthHeaders = () => {
    const token = JSON.parse(localStorage.getItem("user")).accessToken;
    if (!token) {
      showToast("User not logged in. Token missing.", "error");
      router.push("/login");
      return;
    }
    return { Authorization: `Bearer ${token}` };
  };
  const handleLogout = async () => {
    setData(null);
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      localStorage.removeItem("user");
      showToast("Logged out successfull", "success");
      console.log("Logged out successfully");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Check for 401 Unauthorized error indicating user not found or incorrect password
        if (error.response.status === 401) {
          console.log(error.message);
          showToast(error.message, "error");
        } else {
          // Handle other types of errors
          console.error("Error Logout in", error);
          // alert("An unexpected error occurred. Please try again later.");
          showToast(error.message, "error");
        }
      } else {
        // Handle network or other issues
        console.error("Network error or server is down", error);
        alert("Network error. Please try again later.");
        showToast("Network error. Please try again later.", "error");
      }
    }
    setData(null);
    router.push("/login");
  };

  //   return (
  //     <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
  //       <h1 className="text-lg font-bold">My App</h1>
  //       {data ? (
  //         <div className="flex items-center gap-4">
  //           <span>Welcome, {data?.user?.username || data?.user.email}</span>
  //           <button
  //             onClick={handleLogout}
  //             className="bg-red-500 px-3 py-1 rounded"
  //           >
  //             Logout
  //           </button>
  //         </div>
  //       ) : (
  //         <a href="/login" className="bg-blue-500 px-3 py-1 rounded">
  //           Sign In
  //         </a>
  //       )}
  //     </nav>
  //   );
  // };

  return (
    <nav className="border-b bg-gray-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4">
        <div>
          <Link href={"/"}>
            <div className="flex items-center gap-1">
              <div className="relative">
                <Hexagon />
                <BookIcon />
              </div>
              <span className="text-xl font-bold uppercase tracking-tight text-primary-500">
                Form
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {/* If user is logged in, show their name, otherwise show Sign in and Sign up buttons */}
          {data ? (
            <>
              <span className="text-sm font-medium text-primary-500">{`Hello, ${data?.user?.username}`}</span>
              <button
                onClick={handleLogout}
                className="h-10 rounded-md border border-primary-500 px-4 py-2 text-sm font-medium text-primary-500 transition-all hover:border-primary-100 hover:bg-primary-100 active:border-primary-200 active:bg-primary-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href={"/login"}>
                <button className="h-10 rounded-md border border-primary-500 px-4 py-2 text-sm font-medium text-primary-500 transition-all hover:border-primary-100 hover:bg-primary-500 active:border-primary-200 active:bg-primary-200">
                  Login
                </button>
              </Link>
              <Link href={"/signup"}>
                <button className="h-10 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary-600 active:bg-primary-700">
                  Sign up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const Hexagon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="45"
    height="45"
    viewBox="0 0 24 24"
    fill="#ce7041"
    stroke="#ce7041"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-hexagon"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const BookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="#fff"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="#ce7041"
    className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
    />
  </svg>
);

export default Navbar;
