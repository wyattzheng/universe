import { Actor, ActorType } from "../layer/entity";
import { Vector2 } from "../shared/math";
import { Human } from "./human";
import { GetRadiusLands, Land } from "./land";

export function BuildPlayerHash(item : string | Player) : string{
    if(item instanceof Player)
       return BuildPlayerHash(item.getConnId());

    return `player.connid.${item}`;
}

export enum PlayerEvent{
    LandUsedEvent = "LandUsedEvent",
    LandNeverUsedEvent = "LandNeverUsedEvent",
    SpawnActorEvent = "SpawnActorEvent",
    DespawnActorEvent = "DespawnActorEvent",
    PlayerRemovedEvent = "PlayerRemovedEvent",
    PlayerAddedEvent = "PlayerAddedEvent",
}

export class Player extends Actor{
    
    private viewLandRadius = 1;

    private connId:string;
    private usedLands = new Map<string,Land>();
    private spawnedActors = new Set<Actor>();

    constructor(connId:string,loc:Vector2){
        super(loc,ActorType.PLAYER);
        this.connId = connId;
    }
    hasSpawned(actor : Actor){
        return this.spawnedActors.has(actor);
    }
    spawnActor(actor : Actor){
        if(this.hasSpawned(actor))
            return;

        console.debug(`Spawn ${actor.getActorId()} To ${this.getConnId()}`);

        this.spawnedActors.add(actor);
        this.emit(PlayerEvent.SpawnActorEvent,actor,this);
    }
    despawnActor(actor : Actor){
        if(!this.hasSpawned(actor))
            return;

        console.debug(`Despawn ${actor.getActorId()} To ${this.getConnId()}`);

        this.spawnedActors.delete(actor);
        this.emit(PlayerEvent.DespawnActorEvent,actor,this);
    }
    hasLand(land:Land){
        return this.usedLands.has(BuildPlayerHash(this));
    }
    addLand(land:Land){
        this.usedLands.set(BuildPlayerHash(this),land);
        this.emit(PlayerEvent.LandUsedEvent,land,this);

    }
    removeLand(land:Land){
        this.usedLands.delete(BuildPlayerHash(this));
        this.emit(PlayerEvent.LandNeverUsedEvent,land,this);
    }
    setLands(lands:Land[]){
        const newLands = [];
        const delLands = [];

        const nowLands = Array.from(this.usedLands.values());
        for(const land of nowLands){
            if(!lands.find((la)=>(la == land)))
                delLands.push(land);
        }

        for(const land of lands){
            if(!nowLands.find((la)=>(la == land)))
                newLands.push(land);
        }

        for(const land of newLands)
            this.addLand(land);
        for(const land of delLands)
            this.removeLand(land);

    }
    getCanseeLands(){
        return GetRadiusLands(this.loc,this.viewLandRadius);
    }
    canSeeLand(landLoc:Vector2){
        return Boolean(this.getCanseeLands().find((loc)=>{
            return loc.equals(landLoc);
        }));
    }

    getConnId(){
        return this.connId;
    }

}