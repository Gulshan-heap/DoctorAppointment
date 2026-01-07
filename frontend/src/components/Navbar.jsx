import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();

  const {token,setToken,userData} = useContext(AppContext)

  const [showMenu, setShowMenu] = useState(false);

  const logout = ()=>{
    setToken(false)
    localStorage.removeItem('token')
  }


  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      <img
        onClick={() => navigate("/")}
        className="w-44 cursor-pointer"
        src={assets.logo}
        alt="Logo"
      />

      {/* Desktop Menu */}
      <ul className="hidden md:flex items-start gap-5 font-medium">
        <li>
          <NavLink to="/" className="flex flex-col items-center py-1">
            HOME
            <hr className="border-none h-0.5 bg-primary w-3/5 m-auto hidden" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/doctors" className="flex flex-col items-center py-1">
            ALL DOCTORS
            <hr className="border-none h-0.5 bg-primary w-3/5 m-auto hidden" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/about" className="flex flex-col items-center py-1">
            ABOUT
            <hr className="border-none h-0.5 bg-primary w-3/5 m-auto hidden" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/contact" className="flex flex-col items-center py-1">
            CONTACT
            <hr className="border-none h-0.5 bg-primary w-3/5 m-auto hidden" />
          </NavLink>
        </li>
      </ul>

      <div className="flex items-center gap-4">
        {token && userData ? (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <img
              src={userData.image}
              alt="Profile"
              className="w-8 rounded-full"
            />
            <img
              src={assets.dropdown_icon}
              alt="Dropdown"
              className="w-2.5"
            />

            {/* Profile Dropdown */}
            <div className="absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block">
              <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4">
                <p
                  onClick={() => navigate("my-profile")}
                  className="hover:text-black cursor-pointer"
                >
                  My Profile
                </p>
                <p
                  onClick={() => navigate("my-appointments")}
                  className="hover:text-black cursor-pointer"
                >
                  My Appointments
                </p>
                <p
                  onClick={logout}
                  className="hover:text-black cursor-pointer"
                >
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block"
          >
            Create account
          </button>
        )}

        {/* Mobile Menu Button */}
        <img
          onClick={() => setShowMenu(true)}
          className="w-6 md:hidden cursor-pointer"
          src={assets.menu_icon}
          alt="Open menu"
        />

        {/* Mobile Menu */}
        <div
          className={`${
            showMenu ? "fixed w-full" : "h-0 w-0"
          } md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img className="w-36" src={assets.logo} alt="Logo" />
            <img
              className="w-7 cursor-pointer"
              onClick={() => setShowMenu(false)}
              src={assets.cross_icon}
              alt="Close menu"
            />
          </div>

          <ul className="flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium">
            <NavLink  to="/" onClick={() => setShowMenu(false)}>
            <p className='px-4 py-2 rounded inline-block'>HOME</p>
            </NavLink>
            <NavLink  to="/doctors" onClick={() => setShowMenu(false)}>
            <p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p>
            </NavLink>
            <NavLink  to="/about" onClick={() => setShowMenu(false)}>
            <p className='px-4 py-2 rounded inline-block'>ABOUT</p>
            </NavLink>
            <NavLink  to="/contact" onClick={() => setShowMenu(false)}>
            <p className='px-4 py-2 rounded inline-block'>CONTACT</p>
            </NavLink>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
