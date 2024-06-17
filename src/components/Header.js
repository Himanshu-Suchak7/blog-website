import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle";

const Header = ({ active, setActive, user, handleLogout }) => {
  const userId = user?.uid;
  const navbarRef = useRef(null);

  useEffect(() => {
    if (navbarRef.current) {
      // Initialize Bootstrap collapse
      new bootstrap.Collapse(navbarRef.current, { toggle: false });
    }
  }, []);

  const closeNavbar = () => {
    if (navbarRef.current) {
      const bsCollapse = bootstrap.Collapse.getInstance(navbarRef.current);
      if (bsCollapse) {
        bsCollapse.hide();
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid bg-faded padding-media">
        <div className="container padding-media">
          <nav className="navbar navbar-toggleable-md navbar-light">
            <button
              className="navbar-toggler mt-3"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              data-bs-parent="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="true"
              aria-label="Toggle Navigation"
            >
              <span className="fa fa-bars"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
              ref={navbarRef}
            >
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <Link to="/" onClick={closeNavbar}>
                  <li onClick={() => setActive("home")}>
                    <img
                      src="/assets/logo.png"
                      alt="logo"
                      className="d-none d-lg-block"
                      style={{
                        width: "90px",
                        height: "60px",
                        borderRadius: "50%",
                        marginRight: "10px",
                        marginLeft: "-80px",
                      }}
                    />
                  </li>
                </Link>
                <Link
                  to="/"
                  style={{ textDecoration: "none" }}
                  onClick={closeNavbar}
                >
                  <li
                    className={`nav-item nav-link ${
                      active === "home" ? "active" : ""
                    }`}
                    onClick={() => setActive("home")}
                  >
                    Home
                  </li>
                </Link>

                <Link
                  to="/blogs"
                  style={{ textDecoration: "none" }}
                  onClick={closeNavbar}
                >
                  <li
                    className={`nav-item nav-link ${
                      active === "blogs" ? "active" : ""
                    }`}
                    onClick={() => setActive("blogs")}
                  >
                    Blogs
                  </li>
                </Link>

                <Link
                  to="/create"
                  style={{ textDecoration: "none" }}
                  onClick={closeNavbar}
                >
                  <li
                    className={`nav-item nav-link ${
                      active === "create" ? "active" : ""
                    }`}
                    onClick={() => setActive("create")}
                  >
                    Create
                  </li>
                </Link>

                <Link
                  to="/about"
                  style={{ textDecoration: "none" }}
                  onClick={closeNavbar}
                >
                  <li
                    className={`nav-item nav-link ${
                      active === "about" ? "active" : ""
                    }`}
                    onClick={() => setActive("about")}
                  >
                    About
                  </li>
                </Link>
              </ul>
              <div className="row g-3">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  {userId ? (
                    <>
                      <div className="profile-logo">
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                          alt="logo"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            marginTop: "12px",
                          }}
                        />
                      </div>
                      <p style={{ marginTop: "12px", marginLeft: "5px" }}>
                        {user?.displayName}
                      </p>
                      <li
                        className="nav-item nav-link"
                        onClick={() => {
                          handleLogout();
                          closeNavbar();
                        }}
                      >
                        Logout
                      </li>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      style={{ textDecoration: "none" }}
                      onClick={closeNavbar}
                    >
                      <li
                        className={`nav-item nav-link ${
                          active === "login" ? "active" : ""
                        }`}
                        onClick={() => setActive("login")}
                      >
                        Login/Signup
                      </li>
                    </Link>
                  )}
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Header;
