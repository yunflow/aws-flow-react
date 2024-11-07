import AdditionWidget from "../components/AdditionWidget";
import { Link } from "@mui/material";

function HomePage() {
    return (
        <div id="home-page">
            <header>
                <h3>
                    <br />
                    Hello, this is Zhaojie<br />
                    个人服务器+Web测试用👇
                </h3>
                <br />
            </header>

            <h4>简单加法应用</h4>
            <AdditionWidget />
            <br />

            <Link href="/game-test" variant="body2">
                Unity Game Test<br />
            </Link>
            <br />

            <a href="/ar-page/ar-page.html" target="_blank">Web AR Test</a>
        </div>
    );
}

export default HomePage;