import AdditionWidget from "../components/AdditionWidget";
import { Link } from "@mui/material";

function HomePage() {
    return (
        <div id="home-page">
            <header>
                <h3>
                    Hello, this is Yunflow <br />
                    还不知道这个网站可以做什么，先放个加法在这里👇
                </h3>
            </header>

            <br /><br /><br />
            <AdditionWidget />

            <br /><br />
            <Link href="/game-test" variant="body2">
                Unity Game Test
            </Link>

            <br /><br />
            <Link href="/ar-test" variant="body2">
                AR Test
            </Link>
        </div>
    );
}

export default HomePage;