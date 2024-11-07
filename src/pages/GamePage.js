import UnityViewer from "../components/UnityViewer"

function GamePage() {
    return (
        <div id="game-page">
            <UnityViewer folder={"game"} project={"crowdrunner"} />
        </div>
    );
}

export default GamePage;