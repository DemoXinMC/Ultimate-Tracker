

class Check
{
    status: Status = Status.UNAVAILABLE;
    update(area: Area) : void { }
}

enum Status
{
    AVAILABLE,
    GLITCHABLE,
    UNAVAILABLE,
    DONE
}

module.exports = Check;