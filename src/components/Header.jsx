const Header = () => {
    return (
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">April 20, 2025</p>
            <h1 className="text-xl font-semibold text-gray-800">
              Good evening, Brandon 👋
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <i className="fa-solid fa-bell text-gray-600"></i>
            </button>
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
          </div>
        </div>
      </header>
    );
  };
  
  export default Header;